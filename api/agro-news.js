export default async function handler(req, res) {
  const { q = 'agro OR agricultura OR soja OR maíz OR ganadería', limit = '10' } = req.query || {};
  const apiKey = process.env.APITUBE_API_KEY;
  const base = 'https://api.apitube.com/v1/news';
  const url = `${base}?limit=${encodeURIComponent(limit)}&q=${encodeURIComponent(q)}`;
  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey || ''}`,
        Accept: 'application/json'
      }
    });
    if (!resp.ok) {
      return res.status(502).json({ error: `Upstream ${resp.status}`, articles: [] });
    }
    const data = await resp.json();
    const articles = data.articles || data.items || data.results || data.data || [];
    return res.status(200).json({ articles });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e), articles: [] });
  }
}