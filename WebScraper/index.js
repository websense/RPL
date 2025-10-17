import express from "express";
import cors from "cors";
// If your file is named webscrape.js, change the import accordingly:
import { scrapeUWAUnit } from "./WebScrapeUWA.js";

const app = express();
app.use(cors());

app.get("/api/uwa/:code", async (req, res) => {
  try {
    const code = req.params.code || "";
    const data = await scrapeUWAUnit(code); // <- uses whatever the user typed
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e?.message || "Scrape failed" });
  }
});

const PORT = 5175;
app.listen(PORT, () => {
  console.log(`Node scraper API running: http://localhost:${PORT}/api/uwa/<CODE>`);
});
