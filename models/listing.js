let mongoose = require("mongoose");
let Review = require("./review.js");

let listingSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    url: String,
    filename: String,
  },
  price: {
    type: Number,
  },
  location: {
    type: String,
  },
  country: {
    type: String,
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  category: {
    type: String,
    enum: [
      "Rooms", "Iconic Cities", "Mountains", "Castles",
      "Amazing Pools", "Camping", "Farms", "Arctic", "Domes", "Boats",
      "Beachfront", "Lakeside", "Treehouses", "Luxury", "Countryside",
      "Desert", "Tropical", "Ski-in/out", "Vineyards", "Historical",
    ],
  },
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: ["Number"],
    },
  },

  // ── Room & Capacity ──
  totalRooms: {
    type: Number,
    min: 1,
  },
  maxGuestsPerRoom: {
    type: Number,
    min: 1,
  },
  bedType: {
    type: String,
    enum: ["Single", "Double", "Queen", "King"],
  },

  // ── Availability ──
  availableFrom: {
    type: Date,
  },
  availableTo: {
    type: Date,
  },
  blockedDates: [
    {
      from: Date,
      to: Date,
      reason: String,
    },
  ],
  minStay: {
    type: Number,
    min: 1,
  },
  maxStay: {
    type: Number,
    min: 1,
  },

  // ── Pricing ──
  weekendPrice: {
    type: Number,
  },
  extraGuestCharge: {
    type: Number,
  },
  cleaningFee: {
    type: Number,
  },
  weeklyDiscount: {
    type: Number,
    min: 0,
    max: 100,
  },
  monthlyDiscount: {
    type: Number,
    min: 0,
    max: 100,
  },

  // ── House Rules ──
  checkInTime: {
    type: String,
  },
  checkOutTime: {
    type: String,
  },
  petsAllowed: {
    type: Boolean,
  },
  smokingAllowed: {
    type: Boolean,
  },
  partiesAllowed: {
    type: Boolean,
  },
  customRules: {
    type: String,
  },

  // ── Cancellation Policy ──
  cancellationPolicy: {
    type: String,
    enum: ["flexible", "moderate", "strict"],
  },
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

let Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
