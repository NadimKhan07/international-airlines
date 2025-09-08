const express = require("express")
const WeatherController = require("../controllers/weatherController")
const authMiddleware = require("../middleware/authMiddleware")
const router = express.Router()

// All weather routes require authentication
router.use(authMiddleware)

router.get("/dhaka", WeatherController.getDhakaWeather)
router.get("/forecast/:city?", WeatherController.getWeatherForecast)
router.post("/multiple", WeatherController.getMultipleCitiesWeather)
router.get("/:city", WeatherController.getCityWeather)

module.exports = router
