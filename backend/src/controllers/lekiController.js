import { getDb } from "../config/db.js";

export const getLeki = async (req, res) => {
  try {
    const db = getDb();
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
};

export const getLekiSuggestions = async (req, res) => {
  try {
    const db = getDb();
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
};

export const getLekById = async (req, res) => {
  try {
    const db = getDb();
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
};
