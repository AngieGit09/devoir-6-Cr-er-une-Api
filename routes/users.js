const express = require("express");
const User = require("../models/user");
const { requireAuth } = require("../middlewares/authentifications");

const router = express.Router();

// liste
router.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json(await User.find().select("-password"));
  } catch (e) {
    next(e);
  }
});

// email
router.get("/:email", requireAuth, async (req, res, next) => {
  try {
    const u = await User.findOne({ email: req.params.email }).select(
      "-password"
    );
    if (!u) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(u);
  } catch (e) {
    next(e);
  }
});

// créer
router.post("/", requireAuth, async (req, res, next) => {
  try {
    res.status(201).json(await User.create(req.body));
  } catch (e) {
    next(e);
  }
});

// modifier
router.put("/:email", requireAuth, async (req, res, next) => {
  try {
    const u = await User.findOneAndUpdate(
      { email: req.params.email },
      req.body,
      { new: true, runValidators: true }
    );
    if (!u) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(u);
  } catch (e) {
    next(e);
  }
});

// supprimer
router.delete("/:email", requireAuth, async (req, res, next) => {
  try {
    const u = await User.findOneAndDelete({ email: req.params.email });
    if (!u) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
