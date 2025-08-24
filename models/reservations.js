const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    catway: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Catway",
      required: true,
    },
    boatName: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

// petite validation logique sur les dates
reservationSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    return next(new Error("endDate doit être >= startDate"));
  }
  next();
});

module.exports = mongoose.model("Reservation", reservationSchema);
