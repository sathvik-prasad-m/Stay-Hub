const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const bookingController = require("../controllers/bookings");

// My Trips
router.get("/", isLoggedIn, wrapAsync(bookingController.getUserBookings));

// Owner Dashboard
router.get("/dashboard", isLoggedIn, wrapAsync(bookingController.ownerDashboard));

// Check availability API (JSON)
router.get("/availability/:id", wrapAsync(bookingController.checkAvailability));

// Create booking
router.post("/listings/:id", isLoggedIn, wrapAsync(bookingController.createBooking));

// Cancel booking
router.post("/:bookingId/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

// Block dates
router.post("/block/:id", isLoggedIn, wrapAsync(bookingController.blockDates));

// Unblock dates
router.post("/unblock/:id/:blockIndex", isLoggedIn, wrapAsync(bookingController.unblockDates));

module.exports = router;
