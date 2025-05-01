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
  owner:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  geometry:{
    type:{
      type:String,
      enum:["Point"],
    },
    coordinates:{
      type:["Number"],
    }
  }
});

listingSchema.post("findOneAndDelete", async(listing)=>{
    if(listing){
        await Review.deleteMany({_id: {$in:listing.reviews}});
    }
});

let Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
