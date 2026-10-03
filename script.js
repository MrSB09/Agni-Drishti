// ============================================================
// FIREWATCH FRONTEND
// ============================================================

// Because FastAPI serves this page,
// we can simply use relative URLs.
//
// No localhost URL.
// No Live Server.
// No CORS proxy.
// No NASA key in the browser.

const FIRE_API = "/fires";

let map;

let fireMarkers = [];


// ============================================================
// INITIALIZE MAP
// ============================================================

function initializeMap() {

    map = L.map("map").setView(
        [22.5937, 78.9629],
        5
    );


    // Normal geographic basemap
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);
}


// ============================================================
// FETCH FIRMS DATA
// ============================================================

async function fetchFireData() {

    console.log(
        "📡 Requesting FIRMS data from FireWatch backend..."
    );


    try {

        const response = await fetch(
            FIRE_API
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.details ||
                "NASA FIRMS request failed."
            );

        }


        console.log(
            `✅ NASA FIRMS returned ${data.count} detections.`
        );


        return data;

    }

    catch (error) {

        console.error(
            "❌ FIRMS data request failed:",
            error
        );


        showError(error);


        return null;
    }
}


// ============================================================
// REMOVE OLD MAP MARKERS
// ============================================================

function clearMarkers() {

    fireMarkers.forEach(
        marker => map.removeLayer(marker)
    );


    fireMarkers = [];
}


// ============================================================
// DISPLAY FIRES
// ============================================================

function renderFires(data) {

    clearMarkers();


    const fires = data.fires;


    // --------------------------------------------------------
    // Dashboard statistics
    // --------------------------------------------------------

    document.getElementById(
        "fireCount"
    ).textContent = fires.length;


    document.getElementById(
        "highPriority"
    ).textContent = data.high_priority;


    document.getElementById(
        "lastUpdate"
    ).textContent =
        new Date().toLocaleTimeString();


    const alertList =
        document.getElementById(
            "alertList"
        );


    alertList.innerHTML = "";


    // --------------------------------------------------------
    // No detections
    // --------------------------------------------------------

    if (fires.length === 0) {

        alertList.innerHTML = `

            <div class="alert">

                <strong>
                    ✓ NO FIRMS DETECTIONS
                </strong>

                <p>
                    No satellite fire detections
                    were returned for the
                    selected region and time range.
                </p>

            </div>

        `;

        return;
           fires.forEach((fire) => {

        const marker = L.circleMarker(
            [fire.latitude, fire.longitude],
            {
                radius: fire.priority === "HIGH" ? 8 : 6,
                color: fire.priority === "HIGH" ? "#ff3b30" : "#ff9500",
                fillColor: fire.priority === "HIGH" ? "#ff3b30" : "#ff9500",
                fillOpacity: 0.85,
                weight: 2
            }
        );

        marker.addTo(map);

        marker.bindPopup(`
            <b>🔥 ${fire.priority} PRIORITY</b>
            <hr>
            Latitude: ${fire.latitude.toFixed(4)}<br>
            Longitude: ${fire.longitude.toFixed(4)}<br><br>
            NASA Confidence: ${fire.confidence || "N/A"}<br>
            FRP: ${fire.frp || "N/A"} MW<br>
            Satellite: ${fire.satellite || "N/A"}<br>
            Date: ${fire.acq_date || "N/A"}
        `);

        fireMarkers.push(marker);
    }); 
    [fire.latitude, fire.longitude]

    }


    // --------------------------------------------------------
    // Coordinates for map bounds
    // --------------------------------------------------------

    const coordinates = [];


    // --------------------------------------------------------
    // Process every fire
    // --------------------------------------------------------

    fires.forEach(
        (fire, index) => {

            coordinates.push([
                fire.latitude,
                fire.longitude
            ]);


            let markerColor;


            if (fire.priority === "HIGH") {

                markerColor = "#ff3b30";

            }

            else if (
                fire.priority === "MEDIUM"
            ) {

                markerColor = "#ff9500";

            }

            else {

                markerColor = "#ffd60a";

            }


            // ------------------------------------------------
            // Map marker
            // ------------------------------------------------

            const marker =
                L.circleMarker(
                    [
                        fire.latitude,
                        fire.longitude
                    ],
                    {

                        radius:
                            fire.priority === "HIGH"
                                ? 8
                                : 6,

                        color:
                            markerColor,

                        fillColor:
                            markerColor,

                        fillOpacity: 0.85,

                        weight: 2

                    }
                );


            marker
                .addTo(map)
                .bindPopup(`

                    <div
                        style="
                            font-family:Arial,sans-serif;
                            min-width:180px;
                        "
                    >

                        <strong
                            style="
                                color:${markerColor};
                            "
                        >
                            🔥
                            ${fire.priority}
                            PRIORITY
                        </strong>

                        <hr>

                        <b>Latitude:</b>
                        ${fire.latitude.toFixed(4)}

                        <br>

                        <b>Longitude:</b>
                        ${fire.longitude.toFixed(4)}

                        <br><br>

                        <b>NASA Confidence:</b>
                        ${fire.confidence || "N/A"}

                        <br>

                        <b>FRP:</b>
                        ${fire.frp || "N/A"} MW

                        <br><br>

                        <b>Satellite:</b>
                        ${fire.satellite || "N/A"}

                        <br>

                        <b>Date:</b>
                        ${fire.acq_date || "N/A"}

                    </div>

                `);


            fireMarkers.push(marker);


            // ------------------------------------------------
            // Alert sidebar
            // ------------------------------------------------

            const alertCard =
                document.createElement(
                    "div"
                );


            alertCard.className =
                "alert";


            alertCard.style.borderLeft =
                `4px solid ${markerColor}`;


            alertCard.innerHTML = `

                <strong
                    style="
                        color:${markerColor};
                    "
                >
                    🔥
                    ${fire.priority}
                    PRIORITY
                </strong>

                <p>
                    Location:
                    ${fire.latitude.toFixed(4)},
                    ${fire.longitude.toFixed(4)}
                </p>

                <p>
                    NASA Confidence:
                    ${fire.confidence || "N/A"}
                </p>

                <p>
                    FRP:
                    ${fire.frp || "N/A"} MW
                </p>

                <p>
                    Satellite:
                    ${fire.satellite || "N/A"}
                </p>

            `;


            alertList.appendChild(
                alertCard
            );


            // ------------------------------------------------
            // NTRO simulation
            // ------------------------------------------------

            if (
                fire.priority === "HIGH"
            ) {

                console.warn(
                    `[SIMULATED NTRO ALERT] ` +
                    `High-priority FIRMS detection: ` +
                    `${fire.latitude.toFixed(4)}, ` +
                    `${fire.longitude.toFixed(4)}`
                );

            }

        }
    );


    // --------------------------------------------------------
    // Fit map to detections
    // --------------------------------------------------------

    if (
        coordinates.length > 0
    ) {

        const bounds =
            L.latLngBounds(
                coordinates
            );


        map.fitBounds(
            bounds,
            {
                padding: [40, 40],
                maxZoom: 8
            }
        );

    }
}


// ============================================================
// ERROR UI
// ============================================================

function showError(error) {

    document.getElementById(
        "fireCount"
    ).textContent = "—";


    document.getElementById(
        "highPriority"
    ).textContent = "—";


    document.getElementById(
        "lastUpdate"
    ).textContent = "ERROR";


    document.getElementById(
        "alertList"
    ).innerHTML = `

        <div
            class="alert"
            style="
                border-left:4px solid #ff3b30;
            "
        >

            <strong
                style="
                    color:#ff3b30;
                "
            >
                ⚠ FIRMS CONNECTION ERROR
            </strong>

            <p>
                FireWatch could not retrieve
                NASA FIRMS data.
            </p>

            <p
                style="
                    font-size:0.8rem;
                "
            >
                Check the Python backend,
                NASA MAP_KEY, and terminal
                for the error message.
            </p>

        </div>

    `;


    console.error(
        "FireWatch error:",
        error
    );
}


// ============================================================
// START APPLICATION
// ============================================================

async function initFireWatch() {

    console.log(
        "🔥 FireWatch starting..."
    );


    initializeMap();


    const data =
        await fetchFireData();


    if (data) {

        renderFires(data);

    }

}


window.addEventListener(
    "DOMContentLoaded",
    initFireWatch
);