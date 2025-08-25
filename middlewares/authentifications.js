const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const _SEC = process.env.KEYS_SECRET;
if (!_SEC) throw new Error("Secret JWT manquant (KEYS_SECRET).");

const SECRET = _SEC;

function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Token manquant" });

    const payload = jwt.verify(token, SECRET);
    req.user = payload;

    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès refusé" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, SECRET };
