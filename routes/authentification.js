const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();
const SECRET = process.env.KEYS_SECRET;
if (!SECRET) throw new Error("Secret JWT manquant (KEYS_SECRET).");

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user)
        return res.status(401).json({ error: "Identifiants invalides" });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: "Identifiants invalides" });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        SECRET,
        { expiresIn: "8h" }
      );
      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
