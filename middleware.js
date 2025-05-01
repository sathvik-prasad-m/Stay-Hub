const {
  reviewValidationSchema,
  listingValidationSchema,
} = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const Listing=require("./models/listing.js");
const Review=require("./models/review.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // res.locals.redirectUrl=res.originalUrl; this will also not work
    req.session.redirectUrl = req.originalUrl;
    req.flash(
      "error",
      "You must be logged in to perform operations on listing!"
    );
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.validateListing = (req, res, next) => {
  let { error } = listingValidationSchema.validate(req.body);

  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewValidationSchema.validate(req.body);

  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

module.exports.isOwner= async (req,res,next)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","You are not the owner of this listing!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.isReviewAuthor= async(req,res,next)=>{
    let {id,reviewId}=req.params;

    let review=await Review.findById(reviewId);
    if(review.author&&!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error","You are not the author of this review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}