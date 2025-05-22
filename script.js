// API Key for OpenWeatherMap
const apiKey = '3a405dbc96c39591ba7ec4acf2c22cff';
const city = 'Nicosia';
const cityId = '146268'; // City ID for Nicosia
const lat = 35.1856; // Latitude for Nicosia
const lon = 33.3823; // Longitude for Nicosia

// DOM Elements
const currentTimeElement = document.getElementById('current-time');
const cityNameElement = document.getElementById('city-name');
const temperatureElement = document.getElementById('temperature');
const weatherDescriptionElement = document.getElementById('weather-description');
const weatherIconElement = document.getElementById('weather-icon');
const aqiElement = document.getElementById('aqi');

// Function to update the current time
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (currentTimeElement) {
        currentTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// Function to fetch and display weather data
async function fetchWeather() {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${apiKey}&units=metric&lang=ru`;

    try {
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (cityNameElement) cityNameElement.textContent = data.name;
        if (temperatureElement) temperatureElement.textContent = data.main.temp;
        if (weatherDescriptionElement) weatherDescriptionElement.textContent = data.weather[0].description;
        if (weatherIconElement) {
            weatherIconElement.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
            weatherIconElement.alt = data.weather[0].description;
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        if (weatherDescriptionElement) weatherDescriptionElement.textContent = 'Не удалось загрузить данные о погоде.';
    }
}

// Function to fetch and display Air Quality Index (AQI)
async function fetchAirQuality() {
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {
        const response = await fetch(airQualityUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.list && data.list.length > 0) {
            const aqiValue = data.list[0].main.aqi;
            let aqiText = '';
            switch (aqiValue) {
                case 1: aqiText = 'Хорошее'; break;
                case 2: aqiText = 'Удовлетворительное'; break;
                case 3: aqiText = 'Умеренное'; break;
                case 4: aqiText = 'Плохое'; break;
                case 5: aqiText = 'Очень плохое'; break;
                default: aqiText = 'Нет данных';
            }
            if (aqiElement) aqiElement.textContent = `${aqiValue} (${aqiText})`;
        } else {
            if (aqiElement) aqiElement.textContent = 'Нет данных';
        }
    } catch (error) {
        console.error('Error fetching air quality data:', error);
        if (aqiElement) aqiElement.textContent = 'Не удалось загрузить AQI.';
    }
}

// Initial calls and interval setup
document.addEventListener('DOMContentLoaded', () => {
    updateTime(); // Initial call to display time immediately
    setInterval(updateTime, 1000); // Update time every second

    fetchWeather(); // Fetch weather data on load
    fetchAirQuality(); // Fetch AQI data on load
});
