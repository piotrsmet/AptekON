import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3"
import fs from "fs"
import {open} from "sqlite"
import SwaggerUI from "swagger-ui-express";
import YAML from "yamljs";


const app = express();
const swaggerDocument = YAML.load("./swagger.yaml")
app.use(cors());
app.use(express.json());
app.use("/api", SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));


let db;

async function initDb() {
  db = await open({
    filename: 'moja_baza.db',
    driver: sqlite3.Database
  });
  console.log("Połączono z bazą SQLite.");
}


app.get("/apteki", async (req, res) =>{
  try {
    const apteki = await db.all("SELECT * FROM apteki");
    res.json(apteki);
  }  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd pobierania danych"});
  }
});

app.get("/apteki/id", async (req, res) =>{
  try {
    const apteki = await db.all("SELECT id FROM apteki");
    res.json(apteki);
  }  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd pobierania danych"});
  }
});


app.get("/api/matches", (req, res) => {
  res.json([
    { id: 1, teamA: "Real Madrid", teamB: "Barcelona", oddsA: 2.1, oddsB: 3.2 },
    { id: 2, teamA: "Arsenal", teamB: "Chelsea", oddsA: 1.9, oddsB: 2.8 },
  ]);
});

const PORT = 5000;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Server działa na porcie ${PORT}`));
}).catch(err => {
  console.error("Błąd przy inicjalizacji bazy:", err);
});