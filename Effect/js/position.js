navigator.geolocation.getCurrentPosition(position => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&appid=c3749b41409e094c605880f69ed9537a` ).then(response => response.json()).then(data => {
        $scan("#position img").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
        $scan("#position span").innerHTML = `${Math.round(data.main.temp - 273.15)}°C ${data.weather[0].main}`;
    });
});