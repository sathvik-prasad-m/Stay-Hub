const User = require("../models/user");
module.exports.renderSignUpForm = (req, res) => {
  res.render("user/signup");
};

module.exports.signUp = async (req, res) => {
  // We are using try catch because we want to display it like a alert
  // not in other page like default wrapAsync
  try {
    let { username, password, email } = req.body;

    let user = new User({
      username: username,
      email: email,
    });

    let registeredUser = await User.register(user, password);

    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Stay Hub!");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.renderLogInForm = (req, res) => {
  res.render("user/login");
};

module.exports.logIn = (req, res) => {
  let redirect = res.locals.redirectUrl || "/listings";
  req.flash("success", "Welcome to Stay Hub!");
  res.redirect(redirect);
};

module.exports.logOut = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out now");
    res.redirect("/listings");
  });
};
