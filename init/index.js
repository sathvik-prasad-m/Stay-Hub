require("dotenv").config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocdingClient = mbxGeocoding({ accessToken: mapToken });

main()
  .then(() => console.log("DB connected Successfully"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.ATLASDB_URL);
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
    listing.owner = "6813803899ec8e1f8916188d";
    listing.geometry=response.body.features[0].geometry;
  }
  await Listing.insertMany(initData.data);
  console.log("Data Initialized...");

  mongoose.connection.close();
};

init();
