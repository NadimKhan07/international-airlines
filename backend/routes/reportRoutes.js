const express = require("express")
const ReportController = require("../controllers/reportController")
const authMiddleware = require("../middleware/authMiddleware")
const router = express.Router()

// All report routes require authentication
router.use(authMiddleware)

router.get("/daily", ReportController.getDailyReport)
router.get("/weekly", ReportController.getWeeklyReport)
router.get("/monthly", ReportController.getMonthlyReport)
router.get("/performance", ReportController.getPerformanceReport)
router.get("/financial", ReportController.getFinancialReport)

module.exports = router
