from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import requests
import csv
import io
from pathlib import Path


# ============================================================
# FIREWATCH BACKEND
# ============================================================

app = FastAPI(title="FireWatch")


# ============================================================
# FILE LOCATIONS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent


# ============================================================
# NASA FIRMS CONFIGURATION
# ============================================================

NASA_MAP_KEY = "68d76d00a5b95fa17ce369f96effcbb9"

FIRMS_SOURCE = "VIIRS_NOAA20_NRT"

# west, south, east, north
INDIA_BOUNDS = "68,6,98,37"

DAY_RANGE = 1


# ============================================================
# PRIORITY LOGIC
# ============================================================

def calculate_priority(confidence, frp):

    """
    FireWatch priority classification.

    This is our own decision-support rule.
    It is NOT a NASA classification.
    """

    if confidence is not None:

        if confidence >= 80:
            return "HIGH"

        elif confidence >= 50:
            return "MEDIUM"

    if frp >= 20:
        return "HIGH"

    elif frp >= 5:
        return "MEDIUM"

    return "LOW"


# ============================================================
# GET DATA FROM NASA FIRMS
# ============================================================
print("MAP KEY LOADED:",bool(NASA_MAP_KEY))
def get_firms_data():

    if (
        not NASA_MAP_KEY
        or NASA_MAP_KEY == "68d76d00a5b95fa17ce369f96effcbb9"
    ):
        raise RuntimeError(
            "NASA MAP_KEY has not been configured."
        )


    url = (
        "https://firms.modaps.eosdis.nasa.gov/"
        f"api/area/csv/"
        f"{NASA_MAP_KEY}/"
        f"{FIRMS_SOURCE}/"
        f"{INDIA_BOUNDS}/"
        f"{DAY_RANGE}"
    )


    print("📡 Requesting NASA FIRMS data...")


    response = requests.get(
        url,
        timeout=30
    )


    response.raise_for_status()


    csv_text = response.text


    reader = csv.DictReader(
        io.StringIO(csv_text)
    )


    fires = []


    for row in reader:

        # ----------------------------------------------------
        # Coordinates
        # ----------------------------------------------------

        try:

            latitude = float(
                row["latitude"]
            )

            longitude = float(
                row["longitude"]
            )

        except (
            ValueError,
            TypeError,
            KeyError
        ):

            continue


        # ----------------------------------------------------
        # Confidence
        # ----------------------------------------------------

        raw_confidence = row.get(
            "confidence",
            ""
        )

        numeric_confidence = None

        try:

            numeric_confidence = float(
                raw_confidence
            )

        except (
            ValueError,
            TypeError
        ):

            pass


        # ----------------------------------------------------
        # Fire Radiative Power
        # ----------------------------------------------------

        raw_frp = row.get(
            "frp",
            ""
        )

        try:

            frp = float(raw_frp)

        except (
            ValueError,
            TypeError
        ):

            frp = 0


        # ----------------------------------------------------
        # Priority
        # ----------------------------------------------------

        priority = calculate_priority(
            numeric_confidence,
            frp
        )


        # ----------------------------------------------------
        # Create FireWatch object
        # ----------------------------------------------------

        fires.append({

            "latitude": latitude,

            "longitude": longitude,

            "confidence": raw_confidence,

            "frp": frp,

            "priority": priority,

            "acq_date": row.get(
                "acq_date",
                ""
            ),

            "acq_time": row.get(
                "acq_time",
                ""
            ),

            "satellite": row.get(
                "satellite",
                ""
            ),

            "instrument": row.get(
                "instrument",
                ""
            ),

            "daynight": row.get(
                "daynight",
                ""
            )

        })


    return fires


# ============================================================
# FIRE DATA API
# ============================================================

@app.get("/fires")
def fires():

    try:

        fire_data = get_firms_data()


        high_priority = sum(
            1
            for fire in fire_data
            if fire["priority"] == "HIGH"
        )


        return {

            "success": True,

            "source": "NASA FIRMS",

            "satellite": FIRMS_SOURCE,

            "count": len(fire_data),

            "high_priority": high_priority,

            "fires": fire_data

        }


    except requests.exceptions.RequestException as error:

        print(
            "❌ NASA FIRMS request failed:",
            error
        )


        return {

            "success": False,

            "source": "NASA FIRMS",

            "error": "NASA FIRMS request failed.",

            "details": str(error),

            "fires": []

        }


    except Exception as error:

        print(
            "❌ Backend error:",
            error
        )


        return {

            "success": False,

            "source": "NASA FIRMS",

            "error": "Backend error.",

            "details": str(error),

            "fires": []

        }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {

        "status": "online",

        "service": "FireWatch Backend"

    }


# ============================================================
# SERVE WEBSITE
# ============================================================

@app.get("/")
def homepage():

    return FileResponse(
        BASE_DIR / "index.html"
    )


@app.get("/style.css")
def stylesheet():

    return FileResponse(
        BASE_DIR / "style.css",
        media_type="text/css"
    )


@app.get("/script.js")
def javascript():

    return FileResponse(
        BASE_DIR / "script.js",
        media_type="application/javascript"
)