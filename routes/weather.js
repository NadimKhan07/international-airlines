const express = require("express")
const axios = require("axios")
const router = express.Router()

// Get weather for a city
router.get("/:city", async (req, res) => {
  try {
    const { city } = req.params
    const apiKey = process.env.WEATHER_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        message: "Weather API key not configured",
        weather: {
          city: city,
          temperature: 25,
          description: "Clear Sky",
          humidity: 60,
          windSpeed: 10,
          icon: "01d",
        },
      })
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`,
    )

    const weatherData = {
      city: response.data.name,
      country: response.data.sys.country,
      temperature: Math.round(response.data.main.temp),
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      pressure: response.data.main.pressure,
      visibility: response.data.visibility / 1000, // Convert to km
      icon: response.data.weather[0].icon,
      sunrise: new Date(response.data.sys.sunrise * 1000),
      sunset: new Date(response.data.sys.sunset * 1000),
    }

    res.json({ weather: weatherData })
  } catch (error) {
    console.error("Weather API error:", error.message)

    // Return mock data if API fails
    res.json({
      weather: {
        city: req.params.city,
        country: "BD",
        temperature: 28,
        description: "Partly Cloudy",
        humidity: 65,
        windSpeed: 8,
        pressure: 1013,
        visibility: 10,
        icon: "02d",
        sunrise: new Date(),
        sunset: new Date(),
      },
      note: "Using mock data - Weather API unavailable",
    })
  }
})

// Get weather forecast
router.get("/:city/forecast", async (req, res) => {
  try {
    const { city } = req.params
    const apiKey = process.env.WEATHER_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        message: "Weather API key not configured",
        forecast: generateMockForecast(city),
      })
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`,
    )

    const forecast = response.data.list.slice(0, 5).map((item) => ({
      date: new Date(item.dt * 1000),
      temperature: Math.round(item.main.temp),
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed,
    }))

    res.json({ forecast })
  } catch (error) {
    console.error("Weather forecast error:", error.message)
    res.json({
      forecast: generateMockForecast(req.params.city),
      note: "Using mock data - Weather API unavailable",
    })
  }
})

// Generate mock forecast data
function generateMockForecast(city) {
  const forecast = []
  const baseTemp = 25

  for (let i = 0; i < 5; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)

    forecast.push({
      date: date,
      temperature: baseTemp + Math.floor(Math.random() * 10) - 5,
      description: ["Clear Sky", "Partly Cloudy", "Cloudy", "Light Rain"][Math.floor(Math.random() * 4)],
      icon: ["01d", "02d", "03d", "10d"][Math.floor(Math.random() * 4)],
      humidity: 60 + Math.floor(Math.random() * 20),
      windSpeed: 5 + Math.floor(Math.random() * 10),
    })
  }

  return forecast
}

module.exports = router
