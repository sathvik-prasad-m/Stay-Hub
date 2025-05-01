const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken =
  "pk.eyJ1Ijoic2F0aHZpazI4IiwiYSI6ImNtYTB6Y2RqejFrcnYyanNnOWwwbTVmNGsifQ.Hqk_IUQpBTwNo7pjQu38-A";
const geocdingClient = mbxGeocoding({ accessToken: mapToken });

main()
  .then(() => console.log("DB connected Successfully"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/stayhub");
}

let init = async () => {
  await Listing.deleteMany({});
  for (listing of initData.data) {
    let response = await geocdingClient
      .forwardGeocode({
        query: listing.location,
        limit: 1,
      })
      .send();
    listing.owner = "6807145f29cddac7e12ac30a";
    listing.geometry=response.body.features[0].geometry;
  }
  await Listing.insertMany(initData.data);
  console.log("Data Initialized...");

  mongoose.connection.close();
};

init();
