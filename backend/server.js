import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3"
import fs from "fs"
import {open} from "sqlite"
import SwaggerUI from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

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



const __dirname = path.resolve(); 
app.use(express.static(path.join(__dirname, "../frontend", "dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
}); 

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


app.post("/uzytkownik/add", async (req, res) => {
  try {
    let {email, haslo, admin} = req.body;

    if (!email || !haslo) {
      return res.status(400).json({ error: "Brakuje danych w body" });
    }

    if (!admin)
      admin = 0;

    await db.run(
      `INSERT INTO uzytkownicy (email, haslo, admin) VALUES (?, ?, ?)`,
      [email, haslo, admin]
    );

    res.json({ message: "Użytkownik dodany!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd zapisu użytkownika" });
  }
});


const PORT = 5000;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Server działa na porcie ${PORT}`));
}).catch(err => {
  console.error("Błąd przy inicjalizacji bazy:", err);
});

