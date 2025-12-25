import { getDb } from "../config/db.js";
import { geocodeAddress } from "../utils/address_fetching.js";

export const getApteki = async (req, res) => {
  try {
    const db = getDb();
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
};

export const createApteka = async (req, res) => {
  try {
    const db = getDb();
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
};

export const getAptekaById = async (req, res) => {  
  try {
    const db = getDb();
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
};

export const updateAptekaOwner = async (req, res) => {
  try {
    const db = getDb();
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
};

export const getAptekaZaopatrzenie = async (req, res) => {
  try {
    const db = getDb();
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
};
