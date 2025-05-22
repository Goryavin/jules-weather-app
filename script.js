// API Key for OpenWeatherMap
const apiKey = '3a405dbc96c39591ba7ec4acf2c22cff';
const defaultCity = 'Nicosia';

// DOM Elements
const currentTimeElement = document.getElementById('current-time');
const cityNameElement = document.getElementById('city-name');
const temperatureElement = document.getElementById('temperature');
const weatherDescriptionElement = document.getElementById('weather-description');
const weatherIconElement = document.getElementById('weather-icon');
const aqiElement = document.getElementById('aqi');
const cityInputElement = document.getElementById('city-input');
const showWeatherButton = document.getElementById('show-weather-btn');
const forecastContainer = document.getElementById('forecast-container');
const pageTitleElement = document.querySelector('title'); // For updating page title
const mainHeadingElement = document.querySelector('h1'); // For updating main heading

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

// Function to display error messages to the user
function displayError(message) {
    if (weatherDescriptionElement) weatherDescriptionElement.textContent = message;
    // Clear other fields that might show old data
    if (temperatureElement) temperatureElement.textContent = '--';
    if (weatherIconElement) weatherIconElement.src = '';
    if (aqiElement) aqiElement.textContent = '--';
    if (forecastContainer) forecastContainer.innerHTML = '<p>Не удалось загрузить прогноз.</p>';
}

// Function to fetch and display weather data
async function fetchWeather(city) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`;

    try {
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Город "${city}" не найден.`);
            } else {
                throw new Error(`Ошибка получения погоды: ${response.status}`);
            }
        }
        const data = await response.json();

        if (cityNameElement) cityNameElement.textContent = data.name;
        if (temperatureElement) temperatureElement.textContent = data.main.temp;
        if (weatherDescriptionElement) weatherDescriptionElement.textContent = data.weather[0].description;
        if (weatherIconElement) {
            weatherIconElement.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
            weatherIconElement.alt = data.weather[0].description;
        }
        
        // Update page title and heading
        const pageTitle = `Погода в ${data.name}`;
        if (pageTitleElement) pageTitleElement.textContent = pageTitle;
        // mainHeadingElement.textContent = `Текущее время и погода в ${data.name}`; // Decided against this to keep heading more static

        return { lat: data.coord.lat, lon: data.coord.lon, name: data.name }; // Return coordinates for AQI
    } catch (error) {
        console.error('Error fetching weather data:', error);
        displayError(error.message || 'Не удалось загрузить данные о погоде.');
        return null; // Indicate failure
    }
}

// Function to fetch and display Air Quality Index (AQI)
async function fetchAirQuality(lat, lon) {
    if (lat === undefined || lon === undefined) {
        if (aqiElement) aqiElement.textContent = 'Координаты не указаны.';
        return;
    }
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {
        const response = await fetch(airQualityUrl);
        if (!response.ok) {
            throw new Error(`Ошибка получения AQI: ${response.status}`);
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
            if (aqiElement) aqiElement.textContent = 'Нет данных AQI';
        }
    } catch (error) {
        console.error('Error fetching air quality data:', error);
        if (aqiElement) aqiElement.textContent = 'Не удалось загрузить AQI.';
    }
}

// Function to fetch and display 5-day weather forecast
async function fetchForecast(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=ru`;

    try {
        const response = await fetch(forecastUrl);
        if (!response.ok) {
             if (response.status === 404) { // City not found is already handled by fetchWeather
                throw new Error(`Прогноз для "${city}" не найден.`);
            } else {
                throw new Error(`Ошибка получения прогноза: ${response.status}`);
            }
        }
        const data = await response.json();

        if (forecastContainer) forecastContainer.innerHTML = ''; // Clear previous forecast

        // Process forecast data (complex part, simplify by taking one forecast per day around noon)
        const dailyData = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyData[date]) {
                dailyData[date] = {
                    temps: [],
                    descriptions: [],
                    icons: []
                };
            }
            dailyData[date].temps.push(item.main.temp);
            dailyData[date].descriptions.push(item.weather[0].description);
            dailyData[date].icons.push(item.weather[0].icon);
        });

        let count = 0;
        for (const date in dailyData) {
            if (count >= 5) break; // Limit to 5 days

            const dayInfo = dailyData[date];
            const minTemp = Math.min(...dayInfo.temps);
            const maxTemp = Math.max(...dayInfo.temps);
            // For simplicity, take the most frequent icon/description or the one around midday
            const typicalIcon = dayInfo.icons[Math.floor(dayInfo.icons.length / 2)];
            const typicalDescription = dayInfo.descriptions[Math.floor(dayInfo.descriptions.length / 2)];
            
            const dayElement = document.createElement('div');
            dayElement.classList.add('forecast-day');
            dayElement.innerHTML = `
                <p><strong>${new Date(date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}</strong></p>
                <img src="https://openweathermap.org/img/wn/${typicalIcon}.png" alt="${typicalDescription}">
                <p>${typicalDescription}</p>
                <p>Макс: ${maxTemp.toFixed(1)}°C</p>
                <p>Мин: ${minTemp.toFixed(1)}°C</p>
            `;
            if (forecastContainer) forecastContainer.appendChild(dayElement);
            count++;
        }
    } catch (error) {
        console.error('Error fetching forecast data:', error);
        if (forecastContainer) forecastContainer.innerHTML = `<p>${error.message || 'Не удалось загрузить прогноз.'}</p>`;
    }
}

// Function to handle fetching all weather-related data for a city
async function updateWeatherData(city) {
    if (!city) {
        displayError("Введите название города.");
        return;
    }
    
    // Clear previous AQI and forecast while new data is loading
    if (aqiElement) aqiElement.textContent = 'Загрузка...';
    if (forecastContainer) forecastContainer.innerHTML = '<p>Загрузка прогноза...</p>';


    const weatherData = await fetchWeather(city); // This now returns {lat, lon, name} or null
    if (weatherData) {
        await fetchAirQuality(weatherData.lat, weatherData.lon);
        await fetchForecast(city); // Use original city query for forecast for consistency
                                   // or weatherData.name if API guarantees it's good for querying
    } else {
        // Error message is already displayed by fetchWeather
        // Clear AQI and forecast if weather fetch failed
        if (aqiElement) aqiElement.textContent = '--';
        if (forecastContainer) forecastContainer.innerHTML = '<p>Прогноз не доступен из-за ошибки загрузки текущей погоды.</p>';
    }
}

// Event Listener for the "Show Weather" button
if (showWeatherButton) {
    showWeatherButton.addEventListener('click', () => {
        const city = cityInputElement.value.trim();
        updateWeatherData(city);
    });
}

// Allow submitting city with Enter key in input field
if (cityInputElement) {
    cityInputElement.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission if it were in a form
            showWeatherButton.click(); // Trigger button click
        }
    });
}


// Initial calls and interval setup
document.addEventListener('DOMContentLoaded', () => {
    updateTime(); // Initial call to display time immediately
    setInterval(updateTime, 1000); // Update time every second

    // Load weather for default city (Nicosia) on page load
    const initialCity = cityInputElement.value.trim() || defaultCity;
    if (cityInputElement && !cityInputElement.value.trim()) { // If input is empty, set to default
        cityInputElement.value = defaultCity;
    }
    updateWeatherData(initialCity);
});
