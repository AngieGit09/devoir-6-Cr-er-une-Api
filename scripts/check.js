const mongoose = require("mongoose");
const Catway = require("../models/catways");
const Reservation = require("../models/reservations");

(async () => {
  try {
    await mongoose.connect(process.env.URL_MONGO);
    console.log("DB :", mongoose.connection.name);
    const catways = await Catway.countDocuments();
    const reservations = await Reservation.countDocuments();
    console.log({ catways, reservations });
  } catch (err) {
    console.error("Check error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
