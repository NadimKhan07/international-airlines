const axios = require("axios")

class WeatherController {
  // Get weather for Dhaka
  static async getDhakaWeather(req, res) {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=Dhaka,BD&appid=${process.env.WEATHER_API_KEY}&units=metric`,
      )

      const weatherData = {
        location: {
          city: response.data.name,
          country: response.data.sys.country,
          coordinates: {
            lat: response.data.coord.lat,
            lon: response.data.coord.lon,
          },
        },
        current: {
          temperature: Math.round(response.data.main.temp),
          feelsLike: Math.round(response.data.main.feels_like),
          humidity: response.data.main.humidity,
          pressure: response.data.main.pressure,
          visibility: response.data.visibility ? (response.data.visibility / 1000).toFixed(1) : null,
          windSpeed: Math.round(response.data.wind.speed * 3.6), // Convert m/s to km/h
          windDirection: response.data.wind.deg,
          condition: response.data.weather[0].main,
          description: response.data.weather[0].description,
          icon: response.data.weather[0].icon,
        },
        timestamp: new Date().toISOString(),
        source: "OpenWeatherMap",
      }

      res.json({
        success: true,
        data: weatherData,
      })
    } catch (error) {
      console.error("Dhaka weather error:", error)

      if (error.response && error.response.status === 401) {
        return res.status(401).json({
          success: false,
          message: "Invalid weather API key",
        })
      }

      res.status(500).json({
        success: false,
        message: "Weather data unavailable for Dhaka",
      })
    }
  }

  // Get weather for any city
  static async getCityWeather(req, res) {
    try {
      const city = req.params.city

      if (!city || city.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "City name is required",
        })
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric`,
      )

      const weatherData = {
        location: {
          city: response.data.name,
          country: response.data.sys.country,
          coordinates: {
            lat: response.data.coord.lat,
            lon: response.data.coord.lon,
          },
        },
        current: {
          temperature: Math.round(response.data.main.temp),
          feelsLike: Math.round(response.data.main.feels_like),
          humidity: response.data.main.humidity,
          pressure: response.data.main.pressure,
          visibility: response.data.visibility ? (response.data.visibility / 1000).toFixed(1) : null,
          windSpeed: Math.round(response.data.wind.speed * 3.6),
          windDirection: response.data.wind.deg,
          condition: response.data.weather[0].main,
          description: response.data.weather[0].description,
          icon: response.data.weather[0].icon,
        },
        timestamp: new Date().toISOString(),
        source: "OpenWeatherMap",
      }

      res.json({
        success: true,
        data: weatherData,
      })
    } catch (error) {
      console.error("City weather error:", error)

      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: "City not found",
        })
      }

      if (error.response && error.response.status === 401) {
        return res.status(401).json({
          success: false,
          message: "Invalid weather API key",
        })
      }

      res.status(500).json({
        success: false,
        message: "Weather data unavailable for this city",
      })
    }
  }

  // Get weather forecast
  static async getWeatherForecast(req, res) {
    try {
      const city = req.params.city || "Dhaka,BD"

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric`,
      )

      const forecastData = {
        location: {
          city: response.data.city.name,
          country: response.data.city.country,
          coordinates: {
            lat: response.data.city.coord.lat,
            lon: response.data.city.coord.lon,
          },
        },
        forecast: response.data.list.slice(0, 8).map((item) => ({
          datetime: item.dt_txt,
          temperature: Math.round(item.main.temp),
          condition: item.weather[0].main,
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: Math.round(item.wind.speed * 3.6),
          icon: item.weather[0].icon,
        })),
        timestamp: new Date().toISOString(),
        source: "OpenWeatherMap",
      }

      res.json({
        success: true,
        data: forecastData,
      })
    } catch (error) {
      console.error("Weather forecast error:", error)
      res.status(500).json({
        success: false,
        message: "Weather forecast unavailable",
      })
    }
  }

  // Get multiple cities weather (for route planning)
  static async getMultipleCitiesWeather(req, res) {
    try {
      const cities = req.body.cities // Array of city names

      if (!Array.isArray(cities) || cities.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cities array is required",
        })
      }

      const weatherPromises = cities.map(async (city) => {
        try {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}&units=metric`,
          )

          return {
            city: response.data.name,
            country: response.data.sys.country,
            temperature: Math.round(response.data.main.temp),
            condition: response.data.weather[0].main,
            description: response.data.weather[0].description,
            windSpeed: Math.round(response.data.wind.speed * 3.6),
            visibility: response.data.visibility ? (response.data.visibility / 1000).toFixed(1) : null,
            success: true,
          }
        } catch (error) {
          return {
            city: city,
            success: false,
            error: "Weather data unavailable",
          }
        }
      })

      const results = await Promise.all(weatherPromises)

      res.json({
        success: true,
        data: results,
      })
    } catch (error) {
      console.error("Multiple cities weather error:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching weather for multiple cities",
      })
    }
  }
}

module.exports = WeatherController
