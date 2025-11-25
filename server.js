import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

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
