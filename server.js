import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// TODO: pega aquí tu API key de NewsData.io si la vas a usar
const NEWSDATA_API_KEY = 'pub_...'; // Reemplaza con tu clave si la usas

const app = express();
const PORT = process.env.PORT || 3000;

// En Vercel, la carpeta 'public' se sirve automáticamente.
// No es necesario usar express.static para los archivos estáticos.
// La función de la API solo se encargará de las rutas /api/*.
app.get('/api/agro-news', async (req, res) => {
  if (!NEWSDATA_API_KEY || NEWSDATA_API_KEY === 'pub_551eaeced3014a828336e2840cc5d63c') {
    return res.status(500).json({ error: 'Configura la API key de NewsData.io en server.js' });
  }

  try {
    const query = encodeURIComponent('agro OR agricultura OR ganaderia OR soja OR maiz OR trigo paraguay');
    const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${query}&language=es&country=py`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al obtener noticias del servicio externo');
    }

    const data = await response.json();

    const articles = (data.results || []).map(item => ({
      title: item.title,
      url: item.link
    }));

    res.json({ articles });
  } catch (error) {
    console.error('Error /api/agro-news:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar las noticias del agro' });
  }
});

// --- NUEVO ENDPOINT PARA COTIZACIONES DE GRANOS ---
app.get('/api/quotes', async (req, res) => {
  const symbols = ['ZS=F', 'ZC=F', 'ZW=F']; // Soja, Maíz, Trigo
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;

  try {
    const yahooResponse = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' } // Yahoo a veces requiere un User-Agent
    });

    if (!yahooResponse.ok) {
      throw new Error(`Error de Yahoo Finance: ${yahooResponse.statusText}`);
    }

    const data = await yahooResponse.json();
    const quotes = {};

    data.quoteResponse.result.forEach(q => {
      quotes[q.symbol] = {
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePct: q.regularMarketChangePercent / 100, // La API lo da en %, lo pasamos a decimal
        ts: q.regularMarketTime
      };
    });

    // El frontend espera un formato específico, lo adaptamos aquí
    const formattedQuotes = {
      'SOY': quotes['ZS=F'],
      'CORN': quotes['ZC=F'],
      'WHEAT': quotes['ZW=F']
    };

    res.json(formattedQuotes);
  } catch (error) {
    console.error('Error en /api/quotes:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar las cotizaciones' });
  }
});

// Vercel se encarga de iniciar el servidor, por lo que app.listen no es necesario.
// En su lugar, exportamos la app para que Vercel la pueda usar.
export default app;
