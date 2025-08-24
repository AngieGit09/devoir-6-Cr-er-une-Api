var express = require("express");
var router = express.Router();

const userRoute = require("../routes/users");

/* GET home page. */
router.get("/", async (req, res, next) => {
  res.status(200).json({
    name: process.env.APP_NAME,
    status: 200,
    message: "Bienvenue sur l'API du port de plaisance de Russell",
  });
});

router.use("/users", userRoute);
module.exports = router;
