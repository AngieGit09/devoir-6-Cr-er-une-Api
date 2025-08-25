const jwt = require("jsonwebtoken");

// 1) Récupérer puis "verrouiller" le type en string
const _SEC = process.env.KEYS_SECRET;
if (!_SEC) throw new Error("Secret JWT manquant (KEYS_SECRET).");
/** @type {string} */
const SECRET = _SEC; // maintenant VS Code sait que c'est une string

function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Token manquant" });

    // 2) SECRET est bien typé string, plus d’erreur "surcharge"
    const payload = jwt.verify(token, SECRET); // { id, email, role }
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

// 3) Export propre (évite d’utiliser exports après module.exports)
module.exports = { requireAuth, requireAdmin, SECRET };
