const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Ponga su clave aquí o exporte APITUBE_API_KEY como variable de entorno
const APITUBE_API_KEY = process.env.APITUBE_API_KEY || 'api_live_MjdgyuqNMpjBEfbCwFKtRo5mhSCIehtyeo6hhjjbHTFrVsl';
const APITUBE_API_URL = process.env.APITUBE_API_URL || 'https://api.apitube.com/v1/news';

// Permitir orígenes para desarrollo. Puede restringir a su dominio en producción.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/api/agro-news', async (req, res) => {
  try {
    // Reenviamos los query params recibidos al endpoint real
    const qs = new URLSearchParams(req.query).toString();
    const url = APITUBE_API_URL + (qs ? `?${qs}` : '');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${APITUBE_API_KEY}`,
        'Accept': 'application/json'
      },
      // timeout config not available directly here; keep simple
    });

    const text = await response.text();
    // Reenviamos el mismo status y body (JSON u otro)
    res.status(response.status).send(text);
  } catch (err) {
    console.error('Proxy error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Error en proxy al obtener noticias', details: err && err.message });
  }
});

app.get('/api/finance/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Error en proxy al obtener datos financieros', details: err && err.message });
  }
});

app.listen(PORT, () => console.log(`Proxy server listening on http://localhost:${PORT}`));
