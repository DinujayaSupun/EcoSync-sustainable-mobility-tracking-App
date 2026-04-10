const axios = require('axios');

class WeatherService {
  constructor() {
    this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
  }

  getApiKey() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error('⚠️ OPENWEATHER_API_KEY is not set in environment variables!');
      throw new Error('OpenWeather API key is not configured');
    }
    return apiKey;
  }

  async getWeatherByCoords(lat, lon) {
    try {
      const apiKey = this.getApiKey();
      console.log('🌤️ Fetching weather by coords:', lat, lon);

      const response = await axios.get(this.baseUrl, {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: 'metric',
        },
      });

      console.log('✅ Weather data received successfully (coords)');
      return {
        condition: response.data.weather[0].main,
        description: response.data.weather[0].description,
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
      };
    } catch (error) {
      console.error('❌ Error fetching weather by coords:', error.message);
      throw new Error('Unable to fetch weather data for the selected location.');
    }
  }

  async getWeather(location) {
    try {
      const apiKey = this.getApiKey();
      
      console.log('🌤️ Fetching weather for:', location);
      console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'UNDEFINED');
      console.log('📍 Full URL:', `${this.baseUrl}?q=${location}&appid=${apiKey}&units=metric`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          q: location,
          appid: apiKey,
          units: 'metric',
        },
      });

      console.log('✅ Weather data received successfully');
      
      return {
        condition: response.data.weather[0].main,
        description: response.data.weather[0].description,
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
      };
    } catch (error) {
      console.error('❌ Error fetching weather data:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error('Unable to fetch weather data. Please check the location name.');
    }
  }

  normalizeForecastData(payload) {
    const list = payload?.list || [];

    const hourly = list.slice(0, 8).map((item) => ({
      time: item.dt_txt,
      timeLabel: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      temp: Math.round(item.main?.temp ?? 0),
      precipitation: Math.round((item.pop || 0) * 100),
      windKmh: Math.round((item.wind?.speed || 0) * 3.6),
      condition: item.weather?.[0]?.main || 'Clouds',
      description: item.weather?.[0]?.description || '',
    }));

    const groups = {};
    list.forEach((item) => {
      const date = item.dt_txt.split(' ')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });

    const daily = Object.entries(groups)
      .slice(0, 7)
      .map(([date, entries]) => {
        const preferred = entries.find((e) => e.dt_txt.includes('12:00:00')) || entries[Math.floor(entries.length / 2)];
        let minTemp = Infinity;
        let maxTemp = -Infinity;
        let maxPop = 0;

        entries.forEach((e) => {
          minTemp = Math.min(minTemp, e.main?.temp_min ?? e.main?.temp ?? 0);
          maxTemp = Math.max(maxTemp, e.main?.temp_max ?? e.main?.temp ?? 0);
          maxPop = Math.max(maxPop, Math.round((e.pop || 0) * 100));
        });

        return {
          date,
          dayLabel: new Date(date).toLocaleDateString([], { weekday: 'short' }),
          dateLabel: new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          dateLong: new Date(date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }),
          minTemp: Math.round(minTemp),
          maxTemp: Math.round(maxTemp),
          precipitation: maxPop,
          windKmh: Math.round((preferred.wind?.speed || 0) * 3.6),
          condition: preferred.weather?.[0]?.main || 'Clouds',
          description: preferred.weather?.[0]?.description || '',
          hourly: entries.map((entry) => ({
            time: entry.dt_txt,
            timeLabel: new Date(entry.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            temp: Math.round(entry.main?.temp ?? 0),
            precipitation: Math.round((entry.pop || 0) * 100),
            windKmh: Math.round((entry.wind?.speed || 0) * 3.6),
            condition: entry.weather?.[0]?.main || 'Clouds',
            description: entry.weather?.[0]?.description || '',
          })),
        };
      });

    return {
      city: payload?.city?.name || 'Current Location',
      hourly,
      daily,
    };
  }

  async getForecastByCoords(lat, lon) {
    try {
      const apiKey = this.getApiKey();

      const response = await axios.get(this.forecastUrl, {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: 'metric',
        },
      });

      return this.normalizeForecastData(response.data);
    } catch (error) {
      console.error('❌ Error fetching forecast by coords:', error.message);
      throw new Error('Unable to fetch weather forecast for the selected location.');
    }
  }

  async getForecast(location) {
    try {
      const apiKey = this.getApiKey();

      const response = await axios.get(this.forecastUrl, {
        params: {
          q: location,
          appid: apiKey,
          units: 'metric',
        },
      });

      return this.normalizeForecastData(response.data);
    } catch (error) {
      console.error('❌ Error fetching forecast:', error.message);
      throw new Error('Unable to fetch weather forecast. Please check the location name.');
    }
  }

  suggestTransport(weatherCondition) {
    const suggestions = {
      Rain: 'Bus',
      Drizzle: 'Bus',
      Thunderstorm: 'Bus',
      Snow: 'Bus',
      Clear: 'Cycling',
      Clouds: 'Carpool',
      Mist: 'Bus',
      Fog: 'Bus',
    };
    return suggestions[weatherCondition] || 'Carpool';
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  suggestByDistance(distanceKm) {
    if (distanceKm <= 2)  return 'Walking';
    if (distanceKm <= 5)  return 'Cycling';
    if (distanceKm <= 10) return 'Tuk-Tuk';
    return 'Bus';
  }

  
  isBadWeather(weatherCondition) {
    return ['Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Mist', 'Fog'].includes(weatherCondition);
  }

  
  adjustSuggestion(weatherSuggestion, weatherCondition, distanceKm) {
    if (this.isBadWeather(weatherCondition)) {
      return {
        transport: weatherSuggestion,
        reason: 'weather-priority',
        distanceKm: parseFloat(distanceKm.toFixed(2)),
      };
    }
    const distanceSuggestion = this.suggestByDistance(distanceKm);
    return {
      transport: distanceSuggestion,
      reason: 'distance-adjusted',
      distanceKm: parseFloat(distanceKm.toFixed(2)),
    };
  }

  async getWeatherBasedSuggestion(location, lat, lon, destLat, destLon) {
    try {
      const weather = (lat && lon)
        ? await this.getWeatherByCoords(lat, lon)
        : await this.getWeather(location);

      const weatherTransport = this.suggestTransport(weather.condition);

      
      let suggestedTransport = weatherTransport;
      let adjustmentReason = null;
      let distanceKm = null;

      if (lat && lon && destLat && destLon) {
        distanceKm = this.haversineDistance(lat, lon, destLat, destLon);
        const adjusted = this.adjustSuggestion(weatherTransport, weather.condition, distanceKm);
        suggestedTransport = adjusted.transport;
        adjustmentReason = adjusted.reason;
        distanceKm = adjusted.distanceKm;
        console.log(`📍 Distance: ${distanceKm} km | Adjusted: ${suggestedTransport} (${adjustmentReason})`);
      }

      return {
        weatherCondition: weather.condition,
        temperature: weather.temperature,
        humidity: weather.humidity,
        suggestedTransport,
        description: weather.description,
        distanceKm,
        adjustmentReason,
        weatherTransport, 
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WeatherService();
