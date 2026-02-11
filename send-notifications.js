const { Expo } = require("expo-server-sdk");

const expo = new Expo({});
const RTDatabase = "https://xalereasysos-default-rtdb.firebaseio.com";

const sendNotifications = async (customBody) => {
  try {
    console.log("🔄 Obteniendo tokens de Firebase...");

    const response = await fetch(`${RTDatabase}/users.json`);
    const data = await response.json();

    console.log("📊 Datos obtenidos de Firebase:", data);

    const somePushTokens = [];
    Object.keys(data).forEach((item) => {
      const token = data[item].token;
      somePushTokens.push(token);
    });

    console.log(`📱 Total de tokens encontrados: ${somePushTokens.length}`);
    console.log("Tokens:", somePushTokens);

    const messages = somePushTokens
      .map((pushToken) => {
        if (!Expo.isExpoPushToken(pushToken)) {
          console.warn(`⚠️ Token inválido: ${pushToken}`);
          return null;
        }

        return {
          to: pushToken,
          sound: "default",
          title: "Alerta de EasySOS App",
          body: customBody,
        };
      })
      .filter((message) => message !== null);

    console.log(`✉️ Mensajes válidos para enviar: ${messages.length}`);

    const chunks = expo.chunkPushNotifications(messages);
    console.log(`📦 Total de chunks a enviar: ${chunks.length}`);

    for (const chunk of chunks) {
      console.log(`🚀 Enviando chunk de ${chunk.length} notificaciones...`);
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("📬 Respuesta del chunk:", ticketChunk);
    }

    console.log("🎉 Todas las notificaciones fueron enviadas");
    return true;
  } catch (error) {
    console.error("💥 Error al enviar notificaciones:", error.message);
    throw error;
  }
};

module.exports = sendNotifications;
