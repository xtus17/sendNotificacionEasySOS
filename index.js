/*
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer"); // ⭐ IMPORTAR MULTER
const sendNotifications = require("./send-notifications.js");
const app = express();
const PORT = process.env.PORT || 3000;

// ⭐ CONFIGURAR MULTER (simple, solo para procesar el formulario)
const upload = multer({ 
  storage: multer.memoryStorage(), // Guardar en memoria (no en disco)
  limits: { fileSize: 5 * 1024 * 1024 } // Máximo 5MB por foto
});

app.use("/", express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));

// Ruta principal
app.get("/", (req, res) => {
  res.render("index");
});

// Ruta GET para mostrar el formulario
app.get("/send-alert", (req, res) => {
  res.render("alert");
});

// ⭐ AGREGAR upload.array('photos', 5) para procesar el formulario
app.post("/send-alert", upload.array('photos', 5), async (req, res) => {
  // Extraer datos de texto del formulario
  const { name, age, description, lastSeen } = req.body;
  
  console.log("📝 Datos recibidos del formulario:");
  console.log({ name, age, description, lastSeen });
  
  try {
    // Crear mensaje personalizado SOLO con datos de texto
    const notificationBody = `🚨 ALERTA PERSONA DESAPARECIDA

Nombre: ${name}
Edad: ${age} años
Descripción: ${description}
Última vez visto: ${lastSeen}`;
    
    console.log("📤 Enviando notificación:");
    console.log(notificationBody);
    
    // Enviar notificaciones a todos los usuarios
    await sendNotifications(notificationBody);
    
    console.log("✅ Notificaciones enviadas exitosamente");
    
    res.render("modal", {
      successMessage: "La alerta de persona desaparecida fue enviada con éxito a todos los usuarios",
    });
  } catch (error) {
    console.error("❌ Error al enviar alerta:", error);
    res.render("modal", {
      errorMessage: "Error al enviar la alerta. Por favor intenta de nuevo.",
    });
  }
});

// Ruta modal
app.get("/modal", (req, res) => {
  res.render("modal");
});

// Ruta para notificaciones generales
app.post("/send-notifications", async (req, res) => {
  const customBody = req.body.customBody || "EasySOS App";

  try {
    await sendNotifications(customBody);

    res.render("modal", {
      successMessage: "Las notificaciones fueron enviadas con éxito",
    });
  } catch (error) {
    console.error("Error al enviar notificaciones:", error);
    res.render("modal", {
      errorMessage: "Las notificaciones no fueron enviadas con éxito",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server start in http://localhost:${PORT}`);
});
*/

const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const sendNotifications = require("./send-notifications.js");
const { db, bucket } = require("./firebaseConfig"); // ⭐ IMPORTAR FIREBASE
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Máximo 5MB por foto
});

app.use("/", express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));

// Ruta principal
app.get("/", (req, res) => {
  res.render("index");
});

// Ruta GET para mostrar el formulario
app.get("/send-alert", (req, res) => {
  res.render("alert");
});

// ⭐ FUNCIÓN PARA SUBIR FOTOS A FIREBASE STORAGE
const uploadPhotosToStorage = async (files) => {
  const photoUrls = [];

  for (const file of files) {
    try {
      // Generar nombre único para la foto
      const timestamp = Date.now();
      const fileName = `missing-persons/${timestamp}-${file.originalname}`;

      // Crear referencia al archivo en Storage
      const fileUpload = bucket.file(fileName);

      // Subir el archivo
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
        public: true, // Hacer la imagen pública
      });

      // Obtener URL pública
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      photoUrls.push(publicUrl);

      console.log(`📸 Foto subida: ${publicUrl}`);
    } catch (error) {
      console.error(`❌ Error subiendo foto ${file.originalname}:`, error);
    }
  }

  return photoUrls;
};

// ⭐ RUTA POST MODIFICADA CON STORAGE + FIRESTORE
app.post("/send-alert", upload.array("photos", 5), async (req, res) => {
  const { name, age, description, lastSeen } = req.body;
  const photos = req.files;

  console.log("📝 Datos recibidos del formulario:");
  console.log({ name, age, description, lastSeen });
  console.log(`📸 Total de fotos recibidas: ${photos.length}`);

  try {
    // 1️⃣ SUBIR FOTOS A FIREBASE STORAGE
    console.log("☁️ Subiendo fotos a Firebase Storage...");
    const photoUrls = await uploadPhotosToStorage(photos);
    console.log(`✅ ${photoUrls.length} fotos subidas exitosamente`);

    // ⭐ FORMATEAR FECHA EN ESPAÑOL
    const now = new Date();
    const formattedDate = now.toLocaleString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "America/Bogota", // UTC-5
      timeZoneName: "short",
    });

    console.log(`📅 Fecha formateada: ${formattedDate}`);

    // 2️⃣ GUARDAR DATOS EN FIRESTORE
    console.log("💾 Guardando datos en Firestore...");
    const alertData = {
      name: name,
      age: parseInt(age),
      description: description,
      lastSeen: lastSeen,
      photoUrls: photoUrls,
      createdAt: formattedDate, // ⭐ FORMATO PERSONALIZADO
    };

    const timestamp = Date.now();

    await db
      .collection("missingPersons")
      .doc(timestamp.toString())
      .set(alertData);
    console.log(`✅ Datos guardados en Firestore con ID: ${timestamp}`);

    // 3️⃣ ENVIAR NOTIFICACIONES (como antes)
    const notificationBody = `🚨 ALERTA PERSONA DESAPARECIDA

    Nombre: ${name}
    Edad: ${age} años
    Descripción: ${description}
    Última vez visto: ${lastSeen}`;

    console.log("📤 Enviando notificaciones...");
    await sendNotifications(notificationBody);
    console.log("✅ Notificaciones enviadas exitosamente");

    res.render("modal", {
      successMessage: `La alerta fue enviada con éxito.`,
    });
  } catch (error) {
    console.error("❌ Error al procesar alerta:", error);
    res.render("modal", {
      errorMessage: "Error al enviar la alerta. Por favor intenta de nuevo.",
    });
  }
});

// Ruta modal
app.get("/modal", (req, res) => {
  res.render("modal");
});

// Ruta para notificaciones generales - ⭐ CORREGIDO
app.post("/send-notifications", async (req, res) => {
  const customBody = req.body.customBody || "EasySOS App";

  console.log("📝 Alerta general recibida:");
  console.log({ customBody });

  try {
    // 1️⃣ GUARDAR EN FIRESTORE
    console.log("💾 Guardando alerta general en Firestore...");

    const now = new Date();
    const formattedDate = now
      .toLocaleString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "America/Lima", // UTC-5
      })
      .replace(/GMT-5|COT|PET/g, "UTC-5");

    const timestamp = Date.now();

    const alertData = {
      message: customBody,
      createdAt: formattedDate,
    };

    await db
      .collection("generalAlerts")
      .doc(timestamp.toString())
      .set(alertData);
    console.log(`✅ Alerta general guardada en Firestore con ID: ${timestamp}`);

    // 2️⃣ ENVIAR NOTIFICACIONES
    console.log("📤 Enviando notificaciones push...");
    await sendNotifications(customBody);
    console.log("✅ Notificaciones enviadas exitosamente");

    // 3️⃣ RESPUESTA ÚNICA
    res.render("modal", {
      successMessage:
        "La alerta fue enviada",
    });
  } catch (error) {
    console.error("❌ Error al enviar alerta general:", error);
    res.render("modal", {
      errorMessage: "Error al enviar la alerta. Por favor intenta de nuevo.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server start in http://localhost:${PORT}`);
});
