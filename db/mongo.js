const mongoose = require("mongoose");

exports.initClientDbConnection = async () => {
  await mongoose.connect(process.env.URL_MONGO); // pas d’options
  console.log(
    "Mongo connecté :",
    mongoose.connection.host,
    "/",
    mongoose.connection.name
  );
};
