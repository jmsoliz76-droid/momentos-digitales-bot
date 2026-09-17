const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { enviarMensajeTexto } = require('../services/whatsapp');

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// ------------------------------------------------------------
// GET /webhook
// Meta llama a esto UNA VEZ cuando configuras el webhook, para
// comprobar que el endpoint es tuyo. Debemos devolver el "challenge"
// tal cual, solo si el verify_token coincide con el nuestro.
// ------------------------------------------------------------
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Verificación exitosa.');
    return res.status(200).send(challenge);
  }

  console.warn('[Webhook] Verificación fallida. Revisa el WHATSAPP_VERIFY_TOKEN.');
  return res.sendStatus(403);
});

// ------------------------------------------------------------
// POST /webhook
// Meta envía aquí cada evento (mensajes entrantes, cambios de estado, etc.)
// ------------------------------------------------------------
router.post('/', async (req, res) => {
  // Respondemos 200 de inmediato: Meta espera una respuesta rápida,
  // si nos tardamos reintenta el envío y duplica mensajes.
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const mensaje = value?.messages?.[0];

    // Puede llegar un evento que no sea un mensaje de texto (ej. status de entrega)
    if (!mensaje) return;

    const telefono = mensaje.from; // número del cliente, ya viene sin '+'
    const texto = mensaje.text?.body || '[mensaje no soportado aún: tipo ' + mensaje.type + ']';
    const whatsappMessageId = mensaje.id;

    console.log(`[Webhook] Mensaje de ${telefono}: ${texto}`);

    // 1. Buscar o crear el cliente
    let { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .maybeSingle();

    if (errCliente) throw errCliente;

    if (!cliente) {
      const { data: nuevoCliente, error: errCrear } = await supabase
        .from('clientes')
        .insert({ telefono })
        .select()
        .single();
      if (errCrear) throw errCrear;
      cliente = nuevoCliente;
      console.log(`[DB] Nuevo cliente creado: ${telefono}`);
    }

    // 2. Buscar o crear su conversación
    let { data: conversacion, error: errConv } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('cliente_id', cliente.id)
      .maybeSingle();

    if (errConv) throw errConv;

    if (!conversacion) {
      const { data: nuevaConv, error: errCrearConv } = await supabase
        .from('conversaciones')
        .insert({ cliente_id: cliente.id, estado: 'INICIO' })
        .select()
        .single();
      if (errCrearConv) throw errCrearConv;
      conversacion = nuevaConv;
      console.log(`[DB] Nueva conversación creada para ${telefono}`);
    }

    // 3. Guardar el mensaje entrante en el historial
    await supabase.from('mensajes').insert({
      conversacion_id: conversacion.id,
      remitente: 'cliente',
      contenido: texto,
      whatsapp_message_id: whatsappMessageId,
    });

    // 4. Si el bot está pausado (atención humana tomó la conversación),
    //    NO respondemos nada automáticamente.
    if (!cliente.bot_activo) {
      console.log(`[Webhook] Bot pausado para ${telefono}, no se responde automáticamente.`);
      return;
    }

    // 5. ETAPA 1: solo confirmamos que el flujo end-to-end funciona.
    //    A partir de la Etapa 2 aquí irá la lógica real de conversación.
    const respuesta = `Recibimos tu mensaje: "${texto}". El bot de Momentos Digitales está en configuración, ¡ya casi listo! 🚀`;

    const envio = await enviarMensajeTexto(telefono, respuesta);

    await supabase.from('mensajes').insert({
      conversacion_id: conversacion.id,
      remitente: 'bot',
      contenido: respuesta,
      whatsapp_message_id: envio?.messages?.[0]?.id || null,
    });
  } catch (error) {
    console.error('[Webhook] Error procesando el mensaje:', error);
  }
});

module.exports = router;
