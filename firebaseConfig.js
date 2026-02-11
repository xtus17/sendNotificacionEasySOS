const admin = require("firebase-admin");

// Inicializar Firebase Admin
if (!admin.apps.length) {
  // ⭐ EN PRODUCCIÓN (Vercel): Usar variables de entorno
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "xalereasysos.firebasestorage.app",
      databaseURL: "https://xalereasysos-default-rtdb.firebaseio.com"
    });
  } 
  // ⭐ EN LOCAL: Usar archivo JSON
  else {
    const serviceAccount = require("./xalerEasyFIREBASEadmin.json");
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "xalereasysos.firebasestorage.app",
      databaseURL: "https://xalereasysos-default-rtdb.firebaseio.com"
    });
  }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
