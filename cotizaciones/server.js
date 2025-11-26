const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

// URL de donde vamos a sacar las cotizaciones
const URL = "https://www.noticiasagricolas.com.br/cotacoes/";

app.get("/api/cotacoes", async (req, res) => {
  try {
    // Pedimos la página
    const response = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome Safari",
      },
    });

    const $ = cheerio.load(response.data);
    const resultado = [];

    // 🔎 EJEMPLO: buscamos la sección "CHICAGO (CME)" y la primera tabla que venga después
    const tituloChicago = $('h2:contains("CHICAGO (CME)")');
    const tabelaChicago = tituloChicago.nextAll("table").first();

    tabelaChicago.find("tbody tr").each((i, row) => {
      const cols = $(row).find("td");
      if (cols.length >= 3) {
        const contrato = $(cols[0]).text().trim();
        const ultimo = $(cols[1]).text().trim();
        const variacao = $(cols[2]).text().trim();

        if (contrato) {
          resultado.push({ contrato, ultimo, variacao });
        }
      }
    });

    res.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar dados:", error.message);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
