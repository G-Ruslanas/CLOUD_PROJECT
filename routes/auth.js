const router = require("express").Router();
const passport = require("passport");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

//Redirect if login failed
router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Failure",
  });
});

//Redirect if login successed
router.get("/login/success", (req, res) => {
  if (req.user) {
    res.status(200).json({
      success: true,
      message: "Successfull",
      user: req.user,
      cookies: req.cookies,
    });
  }
});

//Logout user
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("https://cloud-project-stjl.onrender.com");
});

//Google auth
router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

//Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "https://cloud-project-stjl.onrender.com/",
    failureRedirect: "/login/failed",
  })
);

//Login user
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send("User with specified credentials not found!");
    else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.send("Successfully Authenticated");
      });
    }
  })(req, res, next);
});

//Register user
router.post("/register", (req, res) => {
  User.findOne(
    { $or: [{ username: req.body.username }, { email: req.body.email }] },
    async (err, doc) => {
      if (err) throw err;
      if (doc) res.send("Account with same credentials already exists");
      if (!doc) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
          username: req.body.username,
          password: hashedPassword,
          email: req.body.email,
        });
        await newUser.save();
        res.send("User Created");
      }
    }
  );
});

module.exports = router;
