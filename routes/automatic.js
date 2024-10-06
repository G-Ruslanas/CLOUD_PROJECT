const router = require("express").Router();
const Automatic = require("../models/automatic");

//Update automatic bid by user and auction ID's
router.put("/autobid", async (req, res) => {
  let findAutomaticBid = await Automatic.findOne({
    user_id: req.body.user_id,
    auction_id: req.body.auction_id,
  });

  if (findAutomaticBid && findAutomaticBid.length !== 0) {
    try {
      const updatedAutomaticBid = await Automatic.findOneAndUpdate(
        { user_id: req.body.user_id, auction_id: req.body.auction_id },
        {
          user_id: req.body.user_id,
          auction_id: req.body.auction_id,
          bid: req.body.bid,
          automatic_bid: req.body.automatic_bid,
          status: "In Progress",
        },
        { new: true, runValidators: true }
      );
      res.status(200).json(updatedAutomaticBid);
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    const newAutomaticBid = new Automatic(req.body);
    try {
      const savedAutomaticNewBid = await newAutomaticBid.save();
      res.status(200).json(savedAutomaticNewBid);
    } catch (err) {
      res.status(500).json(err);
    }
  }
});

//Get all automatic bids for all users
router.get("/all", async (req, res) => {
  try {
    const automaticBids = await Automatic.find().where({
      status: "In Progress",
    });
    res.status(200).json(automaticBids);
  } catch (error) {
    res.status(500).json(error);
  }
});

//Get automatic bid by user ID
router.get("/find/:id", async (req, res) => {
  try {
    const automaticBindsByUserId = await Automatic.find({
      user_id: req.params.id,
    });
    res.status(200).json(automaticBindsByUserId);
  } catch (error) {
    res.status(500).json(error);
  }
});

//Update automatic bid by user ID
// router.put("/findAndCancel/:id", async (req, res) => {
//   try {
//     const automaticBindByUserId = await Automatic.findByIdAndUpdate(
//       req.params.id,
//       {
//         $set: { status: "Cancelled" },
//       },
//       { new: true }
//     );
//     res.status(200).json(automaticBindByUserId);
//   } catch (error) {
//     res.status(500).json(error);
//   }
// });

// Delete automatic bid by user ID
router.delete("/findAndCancel/:id", async (req, res) => {
  try {
    const deletedAutomaticBid = await Automatic.findByIdAndDelete(
      req.params.id
    );
    console.log(req.params);
    console.log(deletedAutomaticBid);

    if (!deletedAutomaticBid) {
      return res.status(404).json({ message: "Automatic bid not found" });
    }

    res.status(200).json({
      message: "Automatic bid successfully deleted",
      deletedAutomaticBid,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error });
  }
});

module.exports = router;
