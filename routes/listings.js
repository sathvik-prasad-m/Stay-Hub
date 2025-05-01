const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, validateListing, isOwner } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage}=require("../cloudConfig.js");
const upload = multer({ storage });

router
  .route("/")
  .get(
    // Index route
    wrapAsync(listingController.index)
  )
  .post(
    // New listing
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

// New listing form
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Edit listing form
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

router
  .route("/:id")
  .get(
    // View listing
    wrapAsync(listingController.showListing)
  )
  .put(
    // Edit listing
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    // Delete Listing
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

module.exports = router;
