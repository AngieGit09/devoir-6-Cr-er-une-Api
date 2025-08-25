const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Catway = require("../models/catways");
const Reservation = require("../models/reservations");

let User = null;
try {
  User = require("../models/user");
} catch (_) {}

function normalizeString(s) {
  if (s == null) return "";
  return s
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function normalizeState(state) {
  const t = normalizeString(state);
  if (["free", "libre", "disponible", "bon etat", "bonetat", "ok"].includes(t))
    return "free";
  if (["busy", "occupe", "pris", "reserve", "indisponible"].includes(t))
    return "busy";
  if (["maintenance", "reparation", "hors service", "hs"].includes(t))
    return "maintenance";
  return "free";
}

function normalizeType(type) {
  const t = normalizeString(type);
  if (["long", "grand"].includes(t)) return "long";
  if (["short", "court", "petit"].includes(t)) return "short";
  return "long";
}

function ensureDate(d) {
  const nd = new Date(d);
  if (isNaN(nd.getTime())) throw new Error(`Date invalide: ${d}`);
  return nd;
}

//Chargement des fichiers

function readJSON(relPath) {
  const file = path.join(__dirname, "..", relPath);
  if (!fs.existsSync(file)) throw new Error(`Fichier introuvable: ${relPath}`);
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data))
    throw new Error(`${relPath} doit contenir un tableau JSON`);
  return data;
}

(async () => {
  try {
    const uri = process.env.URL_MONGO;
    if (!uri)
      throw new Error("URL_MONGO manquante (variables d’environnement)");

    await mongoose.connect(uri);
    console.log("Connecté à Mongo");

    // 1) Lire les données
    const catwaysData = readJSON("data/catways.json");
    const reservationsData = readJSON("data/reservations.json");

    const uniqueStates = [...new Set(catwaysData.map((c) => c.catwayState))];
    const uniqueTypes = [...new Set(catwaysData.map((c) => c.catwayType))];
    console.log("États trouvés dans data/catways.json :", uniqueStates);
    console.log("Types  trouvés dans data/catways.json :", uniqueTypes);

    // 2) Catways
    await Catway.deleteMany({});
    const normalizedCatways = catwaysData.map((c) => ({
      catwayNumber: Number(c.catwayNumber),
      catwayType: normalizeType(c.catwayType),
      catwayState: normalizeState(c.catwayState),
    }));
    const insertedCatways = await Catway.insertMany(normalizedCatways);
    console.log(`Catways insérés: ${insertedCatways.length}`);

    // Map catwayNumber -> _id pour lier les réservations
    const byNumber = new Map(
      insertedCatways.map((c) => [c.catwayNumber, c._id])
    );

    // 3) Reservations : wipe + insert (avec contrôles)
    await Reservation.deleteMany({});
    const toInsertReservations = [];
    for (const r of reservationsData) {
      const number = Number(r.catwayNumber);
      const catwayId = byNumber.get(number);
      if (!catwayId) {
        console.warn(
          `Réservation ignorée: catwayNumber ${number} inexistant dans Catway`
        );
        continue;
      }
      try {
        toInsertReservations.push({
          catway: catwayId,
          catwayNumber: number,
          clientName: String(r.clientName || "").trim(),
          boatName: String(r.boatName || "").trim(),
          startDate: ensureDate(r.startDate),
          endDate: ensureDate(r.endDate),
        });
      } catch (e) {
        console.warn(`Réservation ignorée (catway ${number}) : ${e.message}`);
      }
    }
    const insertedResa = await Reservation.insertMany(toInsertReservations);
    console.log(`Réservations insérées: ${insertedResa.length}`);

    // 4) Admin par défaut (si modèle User dispo)
    if (User) {
      const adminEmail = "admin@example.com";
      const adminPwd = "ChangeMe123!";
      await User.deleteMany({ email: adminEmail });
      const hash = await bcrypt.hash(adminPwd, 10);
      await User.create({
        name: "Admin",
        email: adminEmail,
        password: hash,
        role: "admin",
      });
      console.log(`Admin créé: ${adminEmail} / ${adminPwd}`);
    } else {
      console.log("Modèle User non trouvé → skip création admin.");
    }

    console.log("Seed terminé");
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error("Seed erreur:", e);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
})();
