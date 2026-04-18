let Joi = require("joi");

module.exports.listingValidationSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),
    image: Joi.string().allow("", null),
    category: Joi.string().valid(
      "Rooms", "Iconic Cities", "Mountains", "Castles",
      "Amazing Pools", "Camping", "Farms", "Arctic", "Domes", "Boats",
      "Beachfront", "Lakeside", "Treehouses", "Luxury", "Countryside",
      "Desert", "Tropical", "Ski-in/out", "Vineyards", "Historical"
    ).allow("", null),
    // Room & Capacity — no defaults, only saved if owner fills them
    totalRooms: Joi.number().min(1).allow("", null),
    maxGuestsPerRoom: Joi.number().min(1).allow("", null),
    bedType: Joi.string().valid("Single", "Double", "Queen", "King").allow("", null),
    // Availability
    availableFrom: Joi.date().allow("", null),
    availableTo: Joi.date().allow("", null),
    minStay: Joi.number().min(1).allow("", null),
    maxStay: Joi.number().min(1).allow("", null),
    // Pricing
    weekendPrice: Joi.number().min(0).allow("", null),
    extraGuestCharge: Joi.number().min(0).allow("", null),
    cleaningFee: Joi.number().min(0).allow("", null),
    weeklyDiscount: Joi.number().min(0).max(100).allow("", null),
    monthlyDiscount: Joi.number().min(0).max(100).allow("", null),
    // House Rules
    checkInTime: Joi.string().allow("", null),
    checkOutTime: Joi.string().allow("", null),
    petsAllowed: Joi.string().valid("on").allow("", null),
    smokingAllowed: Joi.string().valid("on").allow("", null),
    partiesAllowed: Joi.string().valid("on").allow("", null),
    customRules: Joi.string().allow("", null),
    // Cancellation
    cancellationPolicy: Joi.string().valid("flexible", "moderate", "strict").allow("", null),
  }).required(),
});

module.exports.reviewValidationSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(0).max(5),
    comment: Joi.string().required(),
  }).required(),
});
