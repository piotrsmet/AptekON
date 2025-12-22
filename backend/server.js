import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3"
import fs from "fs"
import {open} from "sqlite"
import SwaggerUI from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import bcrypt from "bcryptjs";
import { geocodeAddress } from "./address_fetching.js";

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
    const { search, fields } = req.query;

    if (fields === 'id') {
        const apteki = await db.all("SELECT id FROM apteki");
        return res.json(apteki);
    }

    if (search && search.trim().length >= 2) {
        const searchTerm = `%${search}%`;
        const apteki = await db.all(
          "SELECT * FROM apteki WHERE nazwa LIKE ? OR wlasciciel_nazwa LIKE ? LIMIT 5",
          [searchTerm, searchTerm]
        );
        return res.json(apteki);
    }

    const apteki = await db.all("SELECT * FROM apteki");
    res.json(apteki);
  }  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd pobierania danych"});
  }
});

app.post("/apteki", async (req, res) => {
  try {
    let {nazwa, miejscowosc, nazwa_ulicy, nr_budynku, kod_pocztowy, telefon, email, wlasciciel_nazwa, wlasciciel_id} = req.body;
    if (!nazwa) {
      return res.status(400).json({ error: "Brakuje danych w body" });
    }
    const {lat, lon} = await geocodeAddress(miejscowosc, nazwa_ulicy, nr_budynku, kod_pocztowy);
    
    if (!telefon) telefon = "";
    if (!email) email = "";
    if (!wlasciciel_nazwa) wlasciciel_nazwa = "";
    if (!wlasciciel_id) wlasciciel_id = null;

    await db.run(
      `INSERT INTO apteki (nazwa, miejscowosc, nazwa_ulicy, nr_budynku, kod_pocztowy, telefon, email, wlasciciel_nazwa, wlasciciel_id, lat, lon) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nazwa, miejscowosc, nazwa_ulicy, nr_budynku, kod_pocztowy, telefon, email, wlasciciel_nazwa, wlasciciel_id, lat, lon]
    );

    res.json({ message: "Apteka dodana!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd zapisu apteki" });
  }
});

app.get("/apteki/:id", async (req, res) => {  
  try {
    const {id} = req.params;
    if (!id) {
      return res.status(400).json({ error: "Brakuje id apteki w zapytaniu" });
    }

    const apteka = await db.get("SELECT * FROM apteki WHERE id = ?", [id]);
    if (!apteka) {
      return res.status(404).json({ error: "Nie znaleziono apteki o podanym id" });
    }

    res.json(apteka);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd pobierania danych" });
  }
});

app.patch("/apteki/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { wlasciciel_id } = req.body;
    if (!id || !wlasciciel_id) {
      return res.status(400).json({ error: "Brakuje id apteki lub wlasciciel_id" });
    }

    await db.run(
      "UPDATE apteki SET wlasciciel_id = ? WHERE id = ?",
      [wlasciciel_id, id]
    );

    res.json({ message: "Zaktualizowano właściciela apteki" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd aktualizacji właściciela apteki" });
  }
});

app.get('/apteki/:id/zaopatrzenie', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Brakuje id apteki w zapytaniu' });
    }

    const result = await db.all(
      `SELECT z.id, z.apteka_id, z.lek_id, z.ilosc, 
              l.nazwa, l.nazwa_powszechna, l.substancja, l.moc, l.droga_podania, l.kraj_pochodzenia
       FROM zaopatrzenie z
       LEFT JOIN leki l ON z.lek_id = l.id
       WHERE z.apteka_id = ?`,
      [id]
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania zaopatrzenia dla apteki' });
  }
});

app.post("/uzytkownicy", async (req, res) => {
  try {
    let {email, haslo, admin} = req.body;

    if (!email || !haslo) {
      return res.status(400).json({ error: "Brakuje danych w body" });
    }

    if (!admin) admin = 0;

    const hashed = await bcrypt.hash(haslo, 10);

    await db.run(
      `INSERT INTO uzytkownicy (email, haslo, admin) VALUES (?, ?, ?)`,
      [email, hashed, admin]
    );

    res.json({ message: "Użytkownik dodany!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd zapisu użytkownika" });
  }
});

app.get('/uzytkownicy', async (req, res) => {
  try {
    const users = await db.all('SELECT id, email, admin FROM uzytkownicy');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania użytkowników' });
  }
});

app.get("/uzytkownicy/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Brakuje id użytkownika w zapytaniu" });
    }

    const uzytkownik = await db.get("SELECT id, email, admin FROM uzytkownicy WHERE id = ?", [id]);
    if (!uzytkownik) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika o podanym id" });
    }

    res.json(uzytkownik);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd pobierania użytkownika" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, haslo } = req.body;
    if (!email || !haslo) {
      return res.status(400).json({ error: "Brakuje danych w body" });
    }

    const user = await db.get("SELECT id, email, haslo, admin FROM uzytkownicy WHERE email = ?", [email]);
    if (!user) {
      return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
    }

    const ok = await bcrypt.compare(haslo, user.haslo);
    if (!ok) {
      return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
    }

    const { haslo: _h, ...userWithoutPass } = user;
    res.json({ message: "Zalogowano poprawnie", user: userWithoutPass });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd logowania" });
  }
});

app.get('/leki', async (req, res) => {
  try {
    const { search } = req.query;

    if (search) {
        const likeQuery = `%${search}%`;
        const leki = await db.all(
          `SELECT * FROM leki 
           WHERE nazwa LIKE ? 
              OR nazwa_powszechna LIKE ? 
              OR substancja LIKE ?
           LIMIT 10`,
          [likeQuery, likeQuery, likeQuery]
        );
        return res.json(leki);
    }

    const leki = await db.all('SELECT * FROM leki');
    res.json(leki);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania leków' });
  }
});

app.get('/leki/suggestions', async (req, res) => {
  try {
    const leki = await db.all(`
      SELECT DISTINCT l.id, l.nazwa 
      FROM zaopatrzenie z
      JOIN leki l ON z.lek_id = l.id
      WHERE z.ilosc > 0
      ORDER BY RANDOM() 
      LIMIT 4
    `);
    res.json(leki);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania sugerowanych leków' });
  }
});

app.get('/leki/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Brakuje id leku w zapytaniu' });
    }

    const lek = await db.get('SELECT * FROM leki WHERE id = ?', [id]);
    if (!lek) {
      return res.status(404).json({ error: 'Nie znaleziono leku o podanym id' });
    }

    res.json(lek);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania leku' });
  }
});

app.get('/zaopatrzenie', async (req, res) => {
  try {
    const { apteka_id, lek_id } = req.query;

    if (lek_id) {
        const zaopatrzenie = await db.all(
            `SELECT id, apteka_id, ilosc
             FROM zaopatrzenie
             WHERE lek_id = ?`,
            [lek_id]
          );
        return res.json(zaopatrzenie);
    }

    let sql = `
      SELECT z.id, z.apteka_id, z.lek_id, z.ilosc, 
             l.nazwa, l.nazwa_powszechna, l.substancja, l.moc
      FROM zaopatrzenie z
      LEFT JOIN leki l ON z.lek_id = l.id
    `;
    const params = [];

    if (apteka_id) {
      sql += ' WHERE z.apteka_id = ?';
      params.push(apteka_id);
    }

    const result = await db.all(sql, params);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania zaopatrzenia' });
  }
});

app.post('/zaopatrzenie', async (req, res) => {
  try {
    const { apteka_id, lek_id, ilosc } = req.body;

    if (!apteka_id || !lek_id || ilosc === undefined) {
      return res.status(400).json({ error: 'Brakuje danych (apteka_id, lek_id, ilosc)' });
    }

    await db.run(
      'INSERT INTO zaopatrzenie (apteka_id, lek_id, ilosc) VALUES (?, ?, ?)',
      [apteka_id, lek_id, ilosc]
    );

    res.json({ message: 'Zaopatrzenie dodane!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd zapisu zaopatrzenia' });
  }
});

app.put('/zaopatrzenie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ilosc } = req.body;

    if (!id || ilosc === undefined) {
      return res.status(400).json({ error: 'Brakuje id lub ilosc' });
    }

    await db.run(
      'UPDATE zaopatrzenie SET ilosc = ? WHERE id = ?',
      [ilosc, id]
    );

    res.json({ message: 'Zaopatrzenie zaktualizowane!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd aktualizacji zaopatrzenia' });
  }
});

const PORT = 5000;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Server działa na porcie ${PORT}`));
}).catch(err => {
  console.error("Błąd przy inicjalizacji bazy:", err);
});