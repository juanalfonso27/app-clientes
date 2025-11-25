import fetch from 'node-fetch';

export default async function handler(req, res) {
  const symbols = ['ZS=F', 'ZC=F', 'ZW=F']; // Soja, Maíz, Trigo
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;

  try {
    const yahooResponse = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!yahooResponse.ok) {
      throw new Error(`Error de Yahoo Finance: ${yahooResponse.statusText}`);
    }

    const data = await yahooResponse.json();
    const quotes = {};

    if (data.quoteResponse && data.quoteResponse.result) {
      data.quoteResponse.result.forEach(q => {
        quotes[q.symbol] = {
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePct: q.regularMarketChangePercent / 100,
          ts: q.regularMarketTime
        };
      });
    }

    const formattedQuotes = {
      'SOY': quotes['ZS=F'],
      'CORN': quotes['ZC=F'],
      'WHEAT': quotes['ZW=F']
    };

    res.status(200).json(formattedQuotes);
  } catch (error) {
    console.error('Error en /api/quotes:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar las cotizaciones' });
  }
}