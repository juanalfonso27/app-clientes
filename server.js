import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Importa tus credenciales de Firebase (asegúrate de que la ruta sea correcta)
// ¡IMPORTANTE! Asegúrate de que este archivo esté en tu .gitignore para no exponer tus credenciales.
import serviceAccount from './firebase-credentials.json' assert { type: 'json' };

// Inicializa la app de Firebase
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const app = express();

// Middleware para parsear JSON en las peticiones
app.use(express.json());
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

// Endpoint para recibir los datos del formulario de contacto y guardarlos en Firestore
app.post('/api/contact', async (req, res) => {
  try {
    const contactData = req.body;

    // Validación básica en el servidor
    if (!contactData.name || !contactData.email || !contactData.message || !contactData.location) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    // Guardar en una colección llamada 'consultas' en Firestore
    const docRef = await db.collection('consultas').add(contactData);

    console.log('Consulta guardada con ID: ', docRef.id);
    res.status(201).json({ message: 'Mensaje recibido con éxito', id: docRef.id });

  } catch (error) {
    console.error('Error al guardar en Firestore:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Endpoint para recibir los datos del formulario de agendar visita
app.post('/api/visit', async (req, res) => {
  try {
    const visitData = req.body;

    // Validación básica en el servidor
    if (!visitData.name || !visitData.farm || !visitData.contact || !visitData.date || !visitData.message) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    // Guardar en una colección llamada 'visitas' en Firestore
    const docRef = await db.collection('visitas').add(visitData);

    console.log('Solicitud de visita guardada con ID: ', docRef.id);
    res.status(201).json({ message: 'Solicitud recibida con éxito', id: docRef.id });

  } catch (error) {
    console.error('Error al guardar solicitud de visita en Firestore:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


