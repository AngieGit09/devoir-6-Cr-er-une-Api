const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

// Connexion MongoDB (env-cmd charge les variables)
require("./db/mongo").initClientDbConnection?.();

// Routers
const catwaysRouter = require("./routes/cataways");

const app = express();

// --- Middlewares globaux
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// --- Ping / accueil
app.get("/", (req, res) => {
  res.type("text/plain").send("API du Port de plaisance de Russel – en ligne");
});
app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    app: process.env.APP_NAME || "API",
    time: new Date(),
  });
});

// --- Routes API
app.use("/api/catways", catwaysRouter); // <-- routes catways + réservations

// -------- USERS (CRUD simple - brouillons)
app.get("/api/users", (req, res) =>
  res.json({ todo: "Lister les utilisateurs" })
);
app.get("/api/users/:email", (req, res) =>
  res.json({ todo: "Détails utilisateur", email: req.params.email })
);
app.post("/api/users", (req, res) =>
  res.status(201).json({ todo: "Créer utilisateur", body: req.body })
);
app.put("/api/users/:email", (req, res) =>
  res.json({
    todo: "Modifier utilisateur",
    email: req.params.email,
    body: req.body,
  })
);
app.delete("/api/users/:email", (req, res) =>
  res.json({ todo: "Supprimer utilisateur", email: req.params.email })
);

// -------- AUTH (login/logout - brouillons)
app.post("/api/auth/login", (req, res) =>
  res.json({ todo: "Connexion (à implémenter)", body: req.body })
);
app.post("/api/auth/logout", (req, res) =>
  res.json({ todo: "Déconnexion (à implémenter)" })
);

// --- 404 JSON (à garder en dernier)
app.use((req, res) => {
  res.status(404).json({ error: "Ressource non trouvée" });
});

// --- Gestion d’erreurs JSON (optionnel mais propre)
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Erreur serveur" });
});

module.exports = app;
