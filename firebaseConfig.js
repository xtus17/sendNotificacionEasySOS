const admin = require("firebase-admin");
const serviceAccount = require("./xalerEasyFIREBASEadmin.json"); // Tu archivo de credenciales

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "xalereasysos.firebasestorage.app", // ⭐ CAMBIA ESTO por tu bucket real
  databaseURL: "https://xalereasysos-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
