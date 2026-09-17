require('dotenv').config();
const express = require('express');
const webhookRouter = require('./routes/webhook');

const app = express();
app.use(express.json());

// Ruta simple para comprobar que el servidor está vivo
// (útil para verificar el deploy en Railway/Render)
app.get('/', (req, res) => {
  res.send('Momentos Digitales Bot - servidor activo ✅');
});

app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
