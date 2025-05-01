const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware");
const userContoller = require("../controllers/users");

router
  .route("/signup")
  .get(userContoller.renderSignUpForm)
  .post(wrapAsync(userContoller.signUp));

router
  .route("/login")
  .get(userContoller.renderLogInForm)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userContoller.logIn
  );

router.get("/logout", userContoller.logOut);

module.exports = router;
