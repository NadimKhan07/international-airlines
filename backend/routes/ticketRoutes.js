const express = require("express")
const TicketController = require("../controllers/ticketController")
const authMiddleware = require("../middleware/authMiddleware")
const router = express.Router()

// All ticket routes require authentication
router.use(authMiddleware)

router.get("/", TicketController.getAllTickets)
router.get("/:id", TicketController.getTicket)
router.post("/", TicketController.createTicket)
router.put("/:id", TicketController.updateTicket)
router.delete("/:id", TicketController.deleteTicket)
router.patch("/:id/pricing", TicketController.updatePricing)
router.get("/flight/:flightNumber", TicketController.getTicketByFlight)

module.exports = router
