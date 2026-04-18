const Listing = require("../models/listing");
const Booking = require("../models/booking");
const ExpressError = require("../utils/ExpressError");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocdingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const q = req.query.q;
  const categories = req.query.category || "";
  const categoryList = categories ? categories.split(",").map(c => c.trim()).filter(Boolean) : [];
  const dateFrom = req.query.dateFrom;
  const dateTo = req.query.dateTo;
  const hasDates = !!(dateFrom && dateTo);
  let filter = {};
  let allListings;

  if (q) {
    const regex = new RegExp(q, "i");
    filter = { $or: [{ title: regex }, { location: regex }, { country: regex }] };
  }

  // Dates selected → only show bookable listings
  if (hasDates) {
    filter.totalRooms = { $exists: true, $ne: null };
    filter.maxGuestsPerRoom = { $exists: true, $ne: null };
  }

  const hasTrending = categoryList.includes("Trending");
  const realCategories = categoryList.filter(c => c !== "Trending");

  if (hasTrending && realCategories.length === 0) {
    allListings = await Listing.aggregate([
      { $match: { ...filter, "reviews.0": { $exists: true } } },
      { $addFields: { reviewCount: { $size: "$reviews" } } },
      { $sort: { reviewCount: -1 } },
      { $limit: 6 },
    ]);
  } else if (realCategories.length > 0) {
    filter.category = { $in: realCategories };
    allListings = await Listing.find(filter);
    if (hasTrending) {
      const tf = { ...filter };
      delete tf.category;
      tf["reviews.0"] = { $exists: true };
      const trending = await Listing.aggregate([
        { $match: tf },
        { $addFields: { reviewCount: { $size: "$reviews" } } },
        { $sort: { reviewCount: -1 } },
        { $limit: 6 },
      ]);
      const ids = new Set(allListings.map(l => l._id.toString()));
      for (const t of trending) { if (!ids.has(t._id.toString())) allListings.push(t); }
    }
  } else {
    allListings = await Listing.find(filter);
  }

  // Date availability — remove fully booked listings
  if (hasDates && allListings.length > 0) {
    const checkIn = new Date(dateFrom);
    const checkOut = new Date(dateTo);
    if (checkOut > checkIn) {
      const bookings = await Booking.find({
        listing: { $in: allListings.map(l => l._id) },
        status: "confirmed",
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
      });
      const bookedMap = {};
      for (const b of bookings) {
        const lid = b.listing.toString();
        if (!bookedMap[lid]) bookedMap[lid] = [];
        bookedMap[lid].push(b);
      }
      allListings = allListings.filter(l => {
        const lid = l._id.toString();
        if (!l.totalRooms) return false;
        const lb = bookedMap[lid] || [];
        if (!lb.length) return true;
        let d = new Date(checkIn);
        while (d < checkOut) {
          let rooms = 0;
          for (const b of lb) {
            if (d >= new Date(b.checkIn) && d < new Date(b.checkOut)) rooms += b.rooms || 1;
          }
          if (rooms >= l.totalRooms) return false;
          d.setDate(d.getDate() + 1);
        }
        return true;
      });
    }
  }

  res.render("listings/index.ejs", {
    allListings,
    searchQuery: q || "",
    activeCategories: categoryList,
    dateFrom: dateFrom || "",
    dateTo: dateTo || "",
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
  let response = await geocdingClient
    .forwardGeocode({ query: req.body.listing.location, limit: 1 })
    .send();

  let { path, filename } = req.file;
  const listing = new Listing(req.body.listing);
  listing.owner = req.user;
  listing.image = { url: path, filename };
  listing.geometry = response.body.features[0].geometry;
  listing.petsAllowed = req.body.listing.petsAllowed === "on";
  listing.smokingAllowed = req.body.listing.smokingAllowed === "on";
  listing.partiesAllowed = req.body.listing.partiesAllowed === "on";

  await listing.save();
  req.flash("success", "Listing Created!");
  res.redirect("/listings");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show", { listing });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  if (!req.body.listing) throw new ExpressError(400, "Send valid data for listing!");
  const { id } = req.params;
  req.body.listing.petsAllowed = req.body.listing.petsAllowed === "on";
  req.body.listing.smokingAllowed = req.body.listing.smokingAllowed === "on";
  req.body.listing.partiesAllowed = req.body.listing.partiesAllowed === "on";
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (req.file) {
    let { path, filename } = req.file;
    listing.image = { url: path, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
