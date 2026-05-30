const express = require("express");
const axios = require("axios");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./history.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT,
      score TEXT,
      level TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

const API_KEY = process.env.API_KEY;

app.post("/check", async (req, res) => {
  try {
    const { phone } = req.body;

    const response = await axios.post(
      "https://shipsure.site/api/check",
      { phone },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    db.run(
      `INSERT INTO history (phone, score, level) VALUES (?, ?, ?)`,
      [
        phone,
        data.delivery_score || "0",
        data.risk_level || "unknown",
      ]
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "فشل تحليل الرقم",
      details: error.message,
    });
  }
});

app.get("/history", (req, res) => {
  db.all(
    `SELECT * FROM history ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
