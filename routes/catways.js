const express = require("express");
const router = express.Router();

const Catway = require("../models/catways");
const Reservation = require("../models/reservations");
const { requireAuth } = require("../middlewares/authentifications");

/*CATWAYS*/

/**
 * @swagger
 * /api/catways:
 *   get:
 *     tags: [Catways]
 *     summary: Lister tous les catways
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", async (req, res, next) => {
  try {
    const list = await Catway.find().sort({ catwayNumber: 1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/catways/{number}:
 *   get:
 *     tags: [Catways]
 *     summary: Détail d’un catway par numéro
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Catway introuvable }
 */
router.get("/:number", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const item = await Catway.findOne({ catwayNumber: number });
    if (!item) return res.status(404).json({ error: "Catway introuvable" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/catways:
 *   post:
 *     tags: [Catways]
 *     summary: Créer un catway
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [catwayNumber, catwayType]
 *             properties:
 *               catwayNumber: { type: integer, example: 1 }
 *               catwayType:   { type: string, enum: [long, short], example: long }
 *               catwayState:  { type: string, example: free }
 *     responses:
 *       201: { description: Créé }
 *       400: { description: Données invalides }
 *       401: { description: Token manquant ou invalide }
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const created = await Catway.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/catways/{number}:
 *   put:
 *     tags: [Catways]
 *     summary: Mettre à jour un catway
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               catwayType:  { type: string, enum: [long, short] }
 *               catwayState: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { description: Token manquant ou invalide }
 *       404: { description: Catway introuvable }
 */
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

/**
 * @swagger
 * /api/catways/{number}:
 *   delete:
 *     tags: [Catways]
 *     summary: Supprimer un catway (et ses réservations)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Supprimé }
 *       401: { description: Token manquant ou invalide }
 *       404: { description: Catway introuvable }
 */
router.delete("/:number", requireAuth, async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const deleted = await Catway.findOneAndDelete({ catwayNumber: number });
    if (!deleted) return res.status(404).json({ error: "Catway introuvable" });
    await Reservation.deleteMany({ catwayNumber: number }); // optionnel
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/*RÉSERVATIONS*/

/**
 * @swagger
 * /api/catways/{number}/reservations:
 *   get:
 *     tags: [Reservations]
 *     summary: Lister les réservations d’un catway
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
router.get("/:number/reservations", async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const list = await Reservation.find({ catwayNumber: number }).sort({
      startDate: 1,
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/catways/{number}/reservations/{idReservation}:
 *   get:
 *     tags: [Reservations]
 *     summary: Détail d’une réservation
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: idReservation
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Réservation introuvable }
 */
router.get("/:number/reservations/:idReservation", async (req, res, next) => {
  try {
    const item = await Reservation.findOne({
      _id: req.params.idReservation,
      catwayNumber: Number(req.params.number),
    });
    if (!item)
      return res.status(404).json({ error: "Réservation introuvable" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/catways/{number}/reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Créer une réservation pour un catway (anti-chevauchement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientName, boatName, startDate, endDate]
 *             properties:
 *               clientName: { type: string, example: Dupont }
 *               boatName:   { type: string, example: BlueSea }
 *               startDate:  { type: string, format: date, example: 2025-09-01 }
 *               endDate:    { type: string, format: date, example: 2025-09-05 }
 *     responses:
 *       201: { description: Créée }
 *       400: { description: Dates invalides }
 *       401: { description: Token manquant ou invalide }
 *       404: { description: Catway introuvable }
 *       409: { description: Chevauchement de réservation }
 */
router.post("/:number/reservations", requireAuth, async (req, res, next) => {
  try {
    const number = Number(req.params.number);
    const catway = await Catway.findOne({ catwayNumber: number });
    if (!catway) return res.status(404).json({ error: "Catway introuvable" });

    const { startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!(start < end))
      return res
        .status(400)
        .json({ error: "Dates invalides (startDate < endDate requis)" });

    // anti-chevauchement
    const overlap = await Reservation.exists({
      catwayNumber: number,
      startDate: { $lt: end },
      endDate: { $gt: start },
    });
    if (overlap)
      return res.status(409).json({ error: "Chevauchement de réservation" });

    const created = await Reservation.create({
      ...req.body,
      catway: catway._id,
      catwayNumber: number,
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/catways/{number}/reservations/{idReservation}:
 *   put:
 *     tags: [Reservations]
 *     summary: Mettre à jour une réservation (anti-chevauchement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: idReservation
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientName: { type: string }
 *               boatName:   { type: string }
 *               startDate:  { type: string, format: date }
 *               endDate:    { type: string, format: date }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Données/Dates invalides }
 *       401: { description: Token manquant ou invalide }
 *       404: { description: Réservation introuvable }
 *       409: { description: Chevauchement de réservation }
 */
router.put(
  "/:number/reservations/:idReservation",
  requireAuth,
  async (req, res, next) => {
    try {
      const number = Number(req.params.number);
      const { startDate, endDate } = req.body;

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!(start < end))
          return res
            .status(400)
            .json({ error: "Dates invalides (startDate < endDate requis)" });

        const overlap = await Reservation.exists({
          catwayNumber: number,
          _id: { $ne: req.params.idReservation },
          startDate: { $lt: end },
          endDate: { $gt: start },
        });
        if (overlap)
          return res
            .status(409)
            .json({ error: "Chevauchement de réservation" });
      }

      const updated = await Reservation.findOneAndUpdate(
        { _id: req.params.idReservation, catwayNumber: number },
        req.body,
        { new: true, runValidators: true }
      );
      if (!updated)
        return res.status(404).json({ error: "Réservation introuvable" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/catways/{number}/reservations/{idReservation}:
 *   delete:
 *     tags: [Reservations]
 *     summary: Supprimer une réservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: idReservation
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Supprimée }
 *       401: { description: Token manquant ou invalide }
 *       404: { description: Réservation introuvable }
 */
router.delete(
  "/:number/reservations/:idReservation",
  requireAuth,
  async (req, res, next) => {
    try {
      const number = Number(req.params.number);
      const deleted = await Reservation.findOneAndDelete({
        _id: req.params.idReservation,
        catwayNumber: number,
      });
      if (!deleted)
        return res.status(404).json({ error: "Réservation introuvable" });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
