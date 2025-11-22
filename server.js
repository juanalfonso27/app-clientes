const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

// TODO: pega aquí tu API key de NewsData.io
const NEWSDATA_API_KEY = 'pub_551eaeced3014a828336e2840cc5d63c';

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos (tu HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname)));

// Endpoint para noticias del agro
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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
