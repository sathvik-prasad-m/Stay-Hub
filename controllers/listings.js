const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const mbxGeocoding=require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken=process.env.MAP_TOKEN;
const geocdingClient=mbxGeocoding({accessToken: mapToken});

module.exports.index = async (req, res) => {
  const allListings = await Listing.find();

  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
  let response=await geocdingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit:1,
    }).send();

  let {path,filename}=req.file;
  const listing = new Listing(req.body.listing);
  listing.owner = req.user;
  listing.image={url: path,filename};
  listing.geometry=response.body.features[0].geometry;
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
    res.redirect("/listings");
  } else res.render("listings/show", { listing });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  } 
  else {
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250")
    res.render("listings/edit.ejs", { listing,originalImageUrl });
  }
};

module.exports.updateListing = async (req, res) => {
  if (!req.body.listing) {
    // Status code 400 => due to client's fault this error has occured
    throw new ExpressError(400, "Send a valid data for listing!");
  }

  const { id } = req.params;
  let listing=await Listing.findByIdAndUpdate(id, {...req.body.listing});

  if(req.file){
    let {path,filename}=req.file;
    listing.image={url: path,filename};
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
