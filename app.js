if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const listingRouter =require("./routes/listings.js");
const reviewRouter=require("./routes/reviews.js");
const userRouter=require("./routes/users.js");

const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash= require("connect-flash");
const passport=require("passport");
const LocalStratergy=require("passport-local");
const User=require("./models/user.js");

const dbUrl=process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Db connected Successfully!");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

const store=MongoStore.create({
  mongoUrl: dbUrl,
  crypto:{
    secret:process.env.SECRET,
  },
  touchAfter: 24*3600
});

store.on("error",()=>{
  console.log("Error in mongo session store", err);
})

const sessionOptions={
  store,
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
    exprires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
    // to prevent from cross attacks (some security issue)
  }
};
app.use(session(sessionOptions));
app.use(flash());// after establishing sesion only flash has to run

app.use(passport.initialize());// for passport first session should be established
app.use(passport.session());// to identify the user in the same session but in df pages
passport.use(new LocalStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());// to store the info of user into the session
passport.deserializeUser(User.deserializeUser());// to remove the info of user from the session

app.use((req,res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.currUser=req.user;
  next();
});

// app.get("/", (req, res) => {
//   res.send("S");
// });

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);

// If the req didn't match with any of the above routes then it'll come here
app.all("/", (req, res) => {
  throw new ExpressError(404, "Page not found!");
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something Went Wrong!" } = err;
  res.status(statusCode).render("error", { message });
});

app.listen("8080", () => {
  console.log("Server is listening to port 8080");
});
