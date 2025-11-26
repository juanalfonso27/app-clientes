import express from "express";
import axios from "axios";
import cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

const URL = "https://www.noticiasagricolas.com.br/cotacoes/";

app.get("/api/cotacoes", async (req, res) => {
    try {
        const response = await axios.get(URL);
        const $ = cheerio.load(response.data);

        let lista = [];

        $(".tabela-cotacoes tbody tr").each((i, el) => {
            const contrato = $(el).find("td:nth-child(1)").text().trim();
            const ultimo = $(el).find("td:nth-child(2)").text().trim();
            const variacao = $(el).find("td:nth-child(3)").text().trim();

            if (contrato) {
                lista.push({ contrato, ultimo, variacao });
            }
        });

        res.json(lista);

    } catch (error) {
        res.json({ error: error.toString() });
    }
});

app.listen(3000, () => console.log("Scraper funcionando en http://localhost:3000"));
