const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    catway: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Catway",
      required: true,
      index: true,
    },
    catwayNumber: { type: Number, required: true, index: true },
    clientName: { type: String, required: true, trim: true },
    boatName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

reservationSchema.index({ catway: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
