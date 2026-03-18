function startTracking() {

    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.watchPosition(function(position) {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log("Location:", lat, lng);

        fetch("http://localhost:3001/api/ambulance/update-location", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                lat: lat,
                lng: lng
            })
        });

    });

}