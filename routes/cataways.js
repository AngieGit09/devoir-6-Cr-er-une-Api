const express = require("express");
const router = express.Router();
const Catway = require("../models/cataways");
const Reservation = require("../models/reservations");
const { requireAuth } = require("../middlewares/authentifications");

// -------- CATWAYS CRUD --------

// GET /api/catways
router.get("/", async (req, res, next) => {
  try {
    const items = await Catway.find().sort("catwayNumber");
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// GET /api/catways/:number
router.get("/:number", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const item = await Catway.findOne({ catwayNumber: number });
    if (!item) return res.status(404).json({ error: "Catway introuvable" });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// POST /api/catways
router.post("/", async (req, res, next) => {
  try {
    const created = await Catway.create(req.body);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// PUT /api/catways/:number
router.put("/:number", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const updated = await Catway.findOneAndUpdate(
      { catwayNumber: number },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Catway introuvable" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/catways/:number
router.delete("/:number", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const deleted = await Catway.findOneAndDelete({ catwayNumber: number });
    if (!deleted) return res.status(404).json({ error: "Catway introuvable" });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

// -------- RÉSERVATIONS (sous-ressource) --------

// Lister réservations d’un catway
// GET /api/catways/:number/reservations
router.get("/:number/reservations", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const catway = await Catway.findOne({ catwayNumber: number });
    if (!catway) return res.status(404).json({ error: "Catway introuvable" });

    const items = await Reservation.find({ catway: catway._id }).sort(
      "-startDate"
    );
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// Détail d’une réservation
// GET /api/catways/:number/reservations/:id
router.get("/:number/reservations/:id", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const catway = await Catway.findOne({ catwayNumber: number });
    if (!catway) return res.status(404).json({ error: "Catway introuvable" });

    const item = await Reservation.findOne({
      _id: req.params.id,
      catway: catway._id,
    });
    if (!item)
      return res.status(404).json({ error: "Réservation introuvable" });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// Création d’une réservation (avec contrôle de chevauchement)
// POST /api/catways/:number/reservations
router.post("/:number/reservations", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const { startDate, endDate } = req.body;

    const catway = await Catway.findOne({ catwayNumber: number });
    if (!catway) return res.status(404).json({ error: "Catway introuvable" });

    // contrôle de chevauchement : A chevauche B si A.start < B.end && B.start < A.end
    const overlap = await Reservation.findOne({
      catway: catway._id,
      startDate: { $lt: new Date(endDate) },
      endDate: { $gt: new Date(startDate) },
    });
    if (overlap) {
      return res
        .status(409)
        .json({ error: "Chevauchement avec une réservation existante" });
    }

    const created = await Reservation.create({
      ...req.body,
      catway: catway._id,
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// Mise à jour d’une réservation
// PUT /api/catways/:number/reservations/:id
router.put("/:number/reservations/:id", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const catway = await Catway.findOne({ catwayNumber: number });
    if (!catway) return res.status(404).json({ error: "Catway introuvable" });

    // si dates modifiées, re-vérifier le chevauchement
    if (req.body.startDate && req.body.endDate) {
      const overlap = await Reservation.findOne({
        _id: { $ne: req.params.id },
        catway: catway._id,
        startDate: { $lt: new Date(req.body.endDate) },
        endDate: { $gt: new Date(req.body.startDate) },
      });
      if (overlap) {
        return res
          .status(409)
          .json({ error: "Chevauchement avec une autre réservation" });
      }
    }

    const updated = await Reservation.findOneAndUpdate(
      { _id: req.params.id, catway: catway._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated)
      return res.status(404).json({ error: "Réservation introuvable" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// Suppression d’une réservation
// DELETE /api/catways/:number/reservations/:id
router.delete("/:number/reservations/:id", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const catway = await Catway.findOne({ catwayNumber: number });
    if (!catway) return res.status(404).json({ error: "Catway introuvable" });

    const deleted = await Reservation.findOneAndDelete({
      _id: req.params.id,
      catway: catway._id,
    });
    if (!deleted)
      return res.status(404).json({ error: "Réservation introuvable" });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

// CREATE  (POST /api/catways)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const created = await Catway.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// UPDATE  (PUT /api/catways/:number)
router.put("/:number", requireAuth, async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const updated = await Catway.findOneAndUpdate(
      { catwayNumber: number },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Catway introuvable" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE  (DELETE /api/catways/:number)
router.delete("/:number", requireAuth, async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const deleted = await Catway.findOneAndDelete({ catwayNumber: number });
    if (!deleted) return res.status(404).json({ error: "Catway introuvable" });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
