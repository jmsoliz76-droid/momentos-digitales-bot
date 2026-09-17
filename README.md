# Momentos Digitales Bot — ETAPA 1

Esta etapa deja funcionando lo básico: recibir mensajes de WhatsApp, guardarlos
en la base de datos, y responder automáticamente para confirmar que todo el
flujo funciona de punta a punta.

## Estructura del proyecto

```
momentos-digitales-bot/
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── server.js              ← arranca el servidor
    ├── config/
    │   └── supabase.js        ← conexión a la base de datos
    ├── routes/
    │   └── webhook.js         ← recibe y responde mensajes de WhatsApp
    ├── services/
    │   └── whatsapp.js        ← función para enviar mensajes
    └── db/
        └── schema.sql         ← estructura completa de la base de datos
```

Descarga esta carpeta completa (te la comparto al final) y súbela tal cual a
un repositorio de GitHub (o directamente a Railway/Render, ambos aceptan
subir una carpeta sin Git si prefieres).

---

## PASO 1 — Crear el proyecto en Supabase

1. Ve a https://supabase.com → crea una cuenta gratis → "New Project".
2. Cuando esté listo, ve a **SQL Editor** → **New query**.
3. Abre el archivo `src/db/schema.sql` de este proyecto, copia **todo** su
   contenido y pégalo ahí. Dale a **Run**.
   - Nota: este script crea TODAS las tablas del sistema completo (no solo
     lo de la Etapa 1), así no tendrás que volver a tocar la base de datos
     más adelante.
4. Ve a **Project Settings → API**. Ahí vas a encontrar dos datos que
   necesitas para el `.env`:
   - **Project URL** → va en `SUPABASE_URL`
   - **service_role key** (no la "anon" key) → va en `SUPABASE_SERVICE_ROLE_KEY`

⚠️ La `service_role key` tiene acceso total a tu base de datos. Nunca la
pongas en el panel/frontend, solo en el backend (variable de entorno).

---

## PASO 2 — Crear la app en Meta for Developers

1. Ve a https://developers.facebook.com/ → **Mis apps** → **Crear app** →
   tipo **"Otro"** → **"Negocio"**.
2. Dentro de la app, busca el producto **WhatsApp** y agrégalo.
3. En la sección de WhatsApp → **Empezar**, Meta te da automáticamente:
   - Un número de prueba (para pruebas puedes usarlo tal cual)
   - El **Phone Number ID** → va en `WHATSAPP_PHONE_NUMBER_ID`
   - Un token temporal de 24h (NO lo uses para producción, es solo para
     probar rápido con curl si quieres)
4. Para el token permanente:
   - Ve a **Configuración del negocio** → **Usuarios del sistema** → crea un
     "System User" con rol Admin.
   - Asígnale la app de WhatsApp con permiso `whatsapp_business_messaging`.
   - Genera un token para ese System User, sin fecha de expiración.
   - Ese token va en `WHATSAPP_TOKEN`.
5. Inventa una palabra/frase secreta cualquiera (ej: `momentos2026secreto`) y
   ponla en `WHATSAPP_VERIFY_TOKEN`. La vas a necesitar en el Paso 4.

Cuando quieras usar tu número real de WhatsApp Business (no el de pruebas),
se hace desde la misma sección, agregando el número y verificándolo por SMS
o llamada — puedes hacerlo más adelante, para probar sirve el número de
pruebas de Meta.

---

## PASO 3 — Desplegar el backend (Railway, gratis para empezar)

1. Ve a https://railway.app → crea cuenta → **New Project** →
   **Deploy from GitHub repo** (conecta tu repo con este proyecto), o usa
   "Empty project" y sube los archivos manualmente si no quieres usar GitHub.
2. Cuando el proyecto esté creado, ve a **Variables** y agrega TODAS las
   variables del archivo `.env.example`, con tus valores reales de los
   pasos anteriores.
3. Railway detecta automáticamente que es Node.js y corre `npm start`.
4. Cuando termine el deploy, Railway te da una URL pública, algo como:
   `https://momentos-digitales-bot-production.up.railway.app`
5. Verifica que funciona entrando a esa URL en el navegador — debe mostrar
   "Momentos Digitales Bot - servidor activo ✅".

(Render funciona prácticamente igual si lo prefieres a Railway.)

---

## PASO 4 — Conectar el webhook en Meta

1. Vuelve a tu app en Meta for Developers → **WhatsApp → Configuración**.
2. En **Webhook**, click en **Editar**.
3. **URL de devolución de llamada**: tu URL de Railway + `/webhook`, ejemplo:
   `https://momentos-digitales-bot-production.up.railway.app/webhook`
4. **Token de verificación**: la misma palabra secreta que pusiste en
   `WHATSAPP_VERIFY_TOKEN`.
5. Click **Verificar y guardar**. Si todo está bien configurado, Meta hace
   una petición GET a tu servidor y este responde automáticamente — no
   tienes que hacer nada manual, ya está en el código (`webhook.js`).
6. Abajo, en **Campos del Webhook**, suscríbete al campo **messages**.

---

## PASO 5 — Probar

1. Desde tu celular, mándale un WhatsApp al número de prueba que te dio Meta
   (lo encuentras en la misma sección de WhatsApp → Empezar, junto con un
   botón para agregar números de prueba destinatarios, ya que el número de
   prueba solo puede hablar con números que tú autorices ahí mismo).
2. Deberías recibir automáticamente:
   *"Recibimos tu mensaje: "...". El bot de Momentos Digitales está en
   configuración, ¡ya casi listo! 🚀"*
3. Revisa en Supabase → **Table Editor** → deberías ver:
   - Un registro nuevo en `clientes`
   - Un registro nuevo en `conversaciones`
   - Dos mensajes en `mensajes` (uno del cliente, uno del bot)

Si algo falla, revisa los **Logs** de Railway — ahí vas a ver exactamente
en qué paso se atoró (token mal copiado, verify_token que no coincide, etc.)

---

## Cuando esto funcione…

Avísame y seguimos con la **ETAPA 2**: la lógica real de conversación
(detección de intención en lenguaje natural, categorías de evento, envío de
modelos desde el catálogo, precios desde la tabla `planes`, recopilación de
datos del pedido, y la derivación a atención humana).
