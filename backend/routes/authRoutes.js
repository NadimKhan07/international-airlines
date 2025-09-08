const express = require("express")
const AuthController = require("../controllers/authController")
const authMiddleware = require("../middleware/authMiddleware")
const router = express.Router()

// Public routes
router.post("/register", AuthController.register)
router.post("/login", AuthController.login)

// Protected routes
router.post("/logout", authMiddleware, AuthController.logout)
router.get("/activity", authMiddleware, AuthController.getLoginActivity)
router.get("/profile/:id", authMiddleware, AuthController.getProfile)
router.put("/profile/:id", authMiddleware, AuthController.updateProfile)
router.put("/change-password/:id", authMiddleware, AuthController.changePassword)

module.exports = router
