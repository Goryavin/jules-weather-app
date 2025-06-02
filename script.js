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
const pageTitleElement = document.querySelector('title');
const mainHeadingElement = document.querySelector('h1');

// New DOM Elements for Asset Prices
const bitcoinPriceElement = document.getElementById('bitcoin-price');
const goldPriceElement = document.getElementById('gold-price');

// --- Existing time functions ---
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (currentTimeElement) {
        currentTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// --- Existing weather functions (fetchWeather, fetchAirQuality, fetchForecast, displayError, updateWeatherData) ---
// (Keep all existing weather-related functions as they are)
// Function to display error messages to the user
function displayError(message) {
    if (weatherDescriptionElement) weatherDescriptionElement.textContent = message;
    if (temperatureElement) temperatureElement.textContent = '--';
    if (weatherIconElement) weatherIconElement.src = '';
    if (aqiElement) aqiElement.textContent = '--';
    if (forecastContainer) forecastContainer.innerHTML = '<p>Не удалось загрузить прогноз.</p>';
}

async function fetchWeather(city) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`;
    try {
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            if (response.status === 404) throw new Error(`Город "${city}" не найден.`);
            else throw new Error(`Ошибка получения погоды: ${response.status}`);
        }
        const data = await response.json();
        if (cityNameElement) cityNameElement.textContent = data.name;
        if (temperatureElement) temperatureElement.textContent = data.main.temp;
        if (weatherDescriptionElement) weatherDescriptionElement.textContent = data.weather[0].description;
        if (weatherIconElement) {
            weatherIconElement.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
            weatherIconElement.alt = data.weather[0].description;
        }
        const pageTitle = `Погода в ${data.name}`;
        if (pageTitleElement) pageTitleElement.textContent = pageTitle;
        return { lat: data.coord.lat, lon: data.coord.lon, name: data.name };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        displayError(error.message || 'Не удалось загрузить данные о погоде.');
        return null;
    }
}

async function fetchAirQuality(lat, lon) {
    if (lat === undefined || lon === undefined) {
        if (aqiElement) aqiElement.textContent = 'Координаты не указаны.';
        return;
    }
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    try {
        const response = await fetch(airQualityUrl);
        if (!response.ok) throw new Error(`Ошибка получения AQI: ${response.status}`);
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

async function fetchForecast(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=ru`;
    try {
        const response = await fetch(forecastUrl);
        if (!response.ok) {
            if (response.status === 404) throw new Error(`Прогноз для "${city}" не найден.`);
            else throw new Error(`Ошибка получения прогноза: ${response.status}`);
        }
        const data = await response.json();
        if (forecastContainer) forecastContainer.innerHTML = '';
        const dailyData = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyData[date]) {
                dailyData[date] = { temps: [], descriptions: [], icons: [] };
            }
            dailyData[date].temps.push(item.main.temp);
            dailyData[date].descriptions.push(item.weather[0].description);
            dailyData[date].icons.push(item.weather[0].icon);
        });
        let count = 0;
        for (const date in dailyData) {
            if (count >= 5) break;
            const dayInfo = dailyData[date];
            const minTemp = Math.min(...dayInfo.temps);
            const maxTemp = Math.max(...dayInfo.temps);
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

async function updateWeatherData(city) {
    if (!city) {
        displayError("Введите название города.");
        return;
    }
    if (aqiElement) aqiElement.textContent = 'Загрузка...';
    if (forecastContainer) forecastContainer.innerHTML = '<p>Загрузка прогноза...</p>';
    const weatherData = await fetchWeather(city);
    if (weatherData) {
        await fetchAirQuality(weatherData.lat, weatherData.lon);
        await fetchForecast(city);
    } else {
        if (aqiElement) aqiElement.textContent = '--';
        if (forecastContainer) forecastContainer.innerHTML = '<p>Прогноз не доступен из-за ошибки загрузки текущей погоды.</p>';
    }
}


// --- New functions for Bitcoin and Gold prices ---
async function fetchBitcoinPrice() {
    if (!bitcoinPriceElement) return;
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CoinGecko API error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.bitcoin && data.bitcoin.usd) {
            bitcoinPriceElement.textContent = `Bitcoin (BTC): $${data.bitcoin.usd.toLocaleString()}`;
        } else {
            bitcoinPriceElement.textContent = 'Bitcoin (BTC): Цена не найдена';
        }
    } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
        bitcoinPriceElement.textContent = 'Bitcoin (BTC): Не удалось загрузить цену';
    }
}

async function fetchGoldPrice() {
    if (!goldPriceElement) return;
    // Placeholder implementation as per plan
    // In a real scenario, you would make an API call here.
    // Example: const goldApiUrl = 'SOME_GOLD_API_URL';
    // try {
    //     const response = await fetch(goldApiUrl);
    //     if (!response.ok) throw new Error('Gold API error!');
    //     const data = await response.json();
    //     // Process data and update goldPriceElement.textContent
    // } catch (error) {
    //     console.error('Error fetching gold price:', error);
    //     goldPriceElement.textContent = 'Gold (XAU): Не удалось загрузить цену';
    // }
    goldPriceElement.textContent = 'Gold (XAU): $2,023.50 USD (Пример)'; // Placeholder
}

// --- Event Listeners ---
if (showWeatherButton) {
    showWeatherButton.addEventListener('click', () => {
        const city = cityInputElement.value.trim();
        updateWeatherData(city);
    });
}
if (cityInputElement) {
    cityInputElement.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            showWeatherButton.click();
        }
    });
}

// --- Initial calls and intervals ---
document.addEventListener('DOMContentLoaded', () => {
    // Time update
    updateTime();
    setInterval(updateTime, 1000);

    // Weather update for default city
    const initialCity = cityInputElement.value.trim() || defaultCity;
    if (cityInputElement && !cityInputElement.value.trim()) {
        cityInputElement.value = defaultCity;
    }
    updateWeatherData(initialCity);

    // Asset prices initial fetch
    fetchBitcoinPrice();
    fetchGoldPrice();

    // Set interval for asset prices (every 10 minutes)
    const assetUpdateInterval = 10 * 60 * 1000; // 10 minutes in milliseconds
    setInterval(fetchBitcoinPrice, assetUpdateInterval);
    setInterval(fetchGoldPrice, assetUpdateInterval); // This will just refresh the placeholder for now
});
