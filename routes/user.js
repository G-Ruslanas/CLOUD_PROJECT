const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");

const whiteList = ["image/png", "image/jpeg", "image/jpg"];

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "./uploads"));
  },
  filename: (req, file, callback) => {
    const ext = file.mimetype.split("/")[1];
    callback(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    if (!whiteList.includes(file.mimetype)) {
      return callback(new Error("File is not allowed"));
    }
    callback(null, true);
  },
});

//Find user by ID
router.get("/find/:id", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
});

//Find all users
router.get("/find", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
});

//Activate or Suspend user by ID
router.put("/modify", async (req, res) => {
  try {
    if (req.body.status === "Activate") {
      const user = await User.findOneAndUpdate(
        { _id: req.body._id },
        {
          $set: { status: "Active", suspension: "" },
        },
        { new: true }
      );
      res.status(200).json(user);
    } else {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(req.body.period));
      const user = await User.findOneAndUpdate(
        { _id: req.body._id },
        {
          $set: { status: "Suspended", suspension: date.toString() },
        },
        { new: true }
      );
      res.status(200).json(user);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//Update user profile
router.put("/update", async (req, res) => {
  let errors = [];

  //Email sender
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "aukcionoinfo@gmail.com",
      pass: "aukcionas123",
    },
  });

  const messageUsername =
    "Username was modified from " +
    req.body.default_username +
    " to " +
    req.body.username +
    ".";
  const messageEmail =
    " Email was modified from " +
    req.body.default_email +
    " to " +
    req.body.email +
    ".";

  const mailOptions = {
    from: "aukcionoinfo@gmail.com",
    to: req.body.default_email,
    subject: "Your Profile Data was modified!",
    text: messageUsername + messageEmail,
  };

  try {
    let newPassValid = false;
    let lengthValid = false;
    const new_password = req.body.new_password;
    const repeat_password = req.body.new_repeat_password;
    const current_password = req.body.current_password;

    //Test email address
    let validEmail = /\S+@\S+\.\S+/;
    if (!validEmail.test(req.body.email)) {
      errors.push("Not valid email address");
    }

    //Test username length
    if (req.body.username.length < 8) {
      errors.push("Username should be at least 8 characters long");
    }

    //Test current password match
    const user = await User.findById({ _id: req.body.id });
    const status = await bcrypt.compare(current_password, user.password);
    if (!status && current_password.length !== 0) {
      errors.push("Current password do not match");
    } else {
      valid = true;
    }

    //Test new password match
    if (
      new_password.length !== 0 &&
      repeat_password.length !== 0 &&
      new_password !== repeat_password
    ) {
      errors.push("Passwords do not match");
    } else {
      newPassValid = true;
    }

    if (
      (new_password.length < 8 || repeat_password.length < 8) &&
      (new_password.length !== 0 || repeat_password.length !== 0)
    ) {
      errors.push("New password less than 8 characters long");
    } else {
      lengthValid = true;
    }

    //Test that all password fields are filled
    if (
      current_password.length === 0 &&
      new_password.length !== 0 &&
      repeat_password.length !== 0 &&
      lengthValid &&
      newPassValid
    ) {
      errors.push("Fill all passwords fields correctly to change password");
    }

    //Test if user with username or email exist already
    const foundUserWithUsername = await User.findOne({
      username: req.body.username,
    });
    const foundUserWithEmail = await User.findOne({
      email: req.body.email,
    });

    if (
      foundUserWithUsername &&
      req.body.username !== req.body.default_username
    ) {
      errors.push("User with same username already exists");
    }

    if (foundUserWithEmail && req.body.email !== req.body.default_email) {
      errors.push("User with same email already exists");
    }

    if (errors.length === 0) {
      let hashedPassword = "";
      if (new_password.length !== 0 && repeat_password.length !== 0) {
        hashedPassword = await bcrypt.hash(req.body.new_password, 10);
      } else {
        hashedPassword = user.password;
      }
      errors = [];
      if (req.file) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: req.body.id },
          {
            $set: req.body,
            password: hashedPassword,
            img: req.file.filename,
          },
          { new: true, runValidators: true }
        );
        res.status(200).json(updatedUser);
      } else {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: req.body.id },
          {
            $set: req.body,
            password: hashedPassword,
          },
          { new: true, runValidators: true }
        );

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            res.status(200).json(info.response);
          }
        });

        res.status(200).json(updatedUser);
      }
    } else {
      res.send(errors);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
