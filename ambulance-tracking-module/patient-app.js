let map;
let ambulanceMarker;
let patientMarker;
let directionsService;
let directionsRenderer;

let patientLocation = null;
let trackingInterval = null;

function initMap() {

    const startLocation = { lat: 25.5941, lng: 85.1376 };

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: startLocation
    });

    directionsService = new google.maps.DirectionsService();

    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#ff0000",
            strokeWeight: 4
        }
    });

    directionsRenderer.setMap(map);

    // 🚑 Ambulance Marker
    ambulanceMarker = new google.maps.Marker({
        position: startLocation,
        map: map,
        title: "Ambulance",

        icon: {
            url: "../client/assets/images/ambulance-icon.jpeg",   // use transparent PNG
            scaledSize: new google.maps.Size(40,40),
            anchor: new google.maps.Point(20,20)
        }
    });

    startTracking();
}

function requestAmbulance() {

    navigator.geolocation.getCurrentPosition((position) => {

        patientLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        // 🔵 Patient Marker
        patientMarker = new google.maps.Marker({
            position: patientLocation,
            map: map,
            title: "Patient Location",

            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new google.maps.Size(40,40)
            }
        });

        map.panTo(patientLocation);

    }, () => {

        alert("Unable to detect location");

    });
}

function startTracking() {

    if(trackingInterval) return;

    trackingInterval = setInterval(async () => {

        try{

            const res = await fetch("http://localhost:3001/api/ambulance/location");
            const data = await res.json();

            const ambulanceLocation = {
                lat: data.lat,
                lng: data.lng
            };

            // Move ambulance
            ambulanceMarker.setPosition(ambulanceLocation);

            if(patientLocation){
                drawRoute(ambulanceLocation, patientLocation);
            }

        }catch(err){

            console.log("Tracking error",err);

        }

    },3000);
}

function drawRoute(ambulance, patient){

    const request = {
        origin: ambulance,
        destination: patient,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request,(result,status)=>{

        if(status === "OK"){

            directionsRenderer.setDirections(result);

            const leg = result.routes[0].legs[0];

            document.getElementById("distance").innerText =
                "Distance: " + leg.distance.text;

            document.getElementById("eta").innerText =
                "ETA: " + leg.duration.text;

        }else{

            console.log("Directions request failed:",status);

        }

    });

}