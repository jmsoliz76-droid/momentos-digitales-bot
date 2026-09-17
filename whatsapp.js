const axios = require('axios');

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

/**
 * Envía un mensaje de texto simple por WhatsApp.
 * @param {string} to - número de destino en formato internacional, sin '+' (ej: 59175582364)
 * @param {string} body - texto del mensaje
 */
async function enviarMensajeTexto(to, body) {
  try {
    const response = await axios.post(
      BASE_URL,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      '[WhatsApp] Error al enviar mensaje:',
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

module.exports = { enviarMensajeTexto };
