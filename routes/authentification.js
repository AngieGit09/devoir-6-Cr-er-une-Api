const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

const SECRET = process.env.KEYS_SECRET;
if (!SECRET) throw new Error("Secret JWT manquant (KEYS_SECRET).");

// POST /api/authentification/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Identifiants invalides" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Identifiants invalides" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
