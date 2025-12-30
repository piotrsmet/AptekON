import { getDb } from "../config/db.js";

export const getRezerwacje = async (req, res) => {
  try {
    const db = getDb();
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'Brakuje user_id' });
    }

    const rezerwacje = await db.all(`
      SELECT r.id, r.user_id, r.apteka_id, r.lek_id, r.ilosc, r.data_rezerwacji, r.data_wygasniecia,
             l.nazwa as lek_nazwa, l.moc as lek_moc,
             a.nazwa as apteka_nazwa, a.nazwa_ulicy, a.nr_budynku, a.miejscowosc
      FROM rezerwacje r
      LEFT JOIN leki l ON r.lek_id = l.id
      LEFT JOIN apteki a ON r.apteka_id = a.id
      WHERE r.user_id = ? AND r.data_wygasniecia > datetime('now')
      ORDER BY r.data_rezerwacji DESC
    `, [user_id]);

    res.json(rezerwacje);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania rezerwacji' });
  }
};

export const getRezerwacjeByApteka = async (req, res) => {
  try {
    const db = getDb();
    const { apteka_id, user_id } = req.query;

    if (!apteka_id || !user_id) {
      return res.status(400).json({ error: 'Brakuje apteka_id lub user_id' });
    }

    const rezerwacje = await db.all(`
      SELECT r.id, r.lek_id, r.ilosc
      FROM rezerwacje r
      WHERE r.apteka_id = ? AND r.user_id = ? AND r.data_wygasniecia > datetime('now')
    `, [apteka_id, user_id]);

    res.json(rezerwacje);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania rezerwacji' });
  }
};

export const createRezerwacja = async (req, res) => {
  try {
    const db = getDb();
    const { user_id, apteka_id, lek_id, ilosc } = req.body;

    if (!user_id || !apteka_id || !lek_id || !ilosc) {
      return res.status(400).json({ error: 'Brakuje danych (user_id, apteka_id, lek_id, ilosc)' });
    }

    // Sprawdź dostępność leku
    const zaopatrzenie = await db.get(
      'SELECT id, ilosc FROM zaopatrzenie WHERE apteka_id = ? AND lek_id = ?',
      [apteka_id, lek_id]
    );

    if (!zaopatrzenie || zaopatrzenie.ilosc < ilosc) {
      return res.status(400).json({ error: 'Niewystarczająca ilość leku w aptece' });
    }

    // Zmniejsz ilość w zaopatrzeniu
    await db.run(
      'UPDATE zaopatrzenie SET ilosc = ilosc - ? WHERE id = ?',
      [ilosc, zaopatrzenie.id]
    );

    // Dodaj rezerwację (ważna 24h)
    const dataRezerwacji = new Date().toISOString();
    const dataWygasniecia = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = await db.run(
      `INSERT INTO rezerwacje (user_id, apteka_id, lek_id, ilosc, data_rezerwacji, data_wygasniecia) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, apteka_id, lek_id, ilosc, dataRezerwacji, dataWygasniecia]
    );

    res.json({ 
      message: 'Rezerwacja utworzona!', 
      id: result.lastID,
      data_wygasniecia: dataWygasniecia
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd tworzenia rezerwacji' });
  }
};

export const cancelRezerwacja = async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { user_id } = req.body;

    if (!id || !user_id) {
      return res.status(400).json({ error: 'Brakuje id rezerwacji lub user_id' });
    }

    // Pobierz rezerwację
    const rezerwacja = await db.get(
      'SELECT * FROM rezerwacje WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (!rezerwacja) {
      return res.status(404).json({ error: 'Rezerwacja nie znaleziona' });
    }

    // Przywróć ilość do zaopatrzenia
    await db.run(
      'UPDATE zaopatrzenie SET ilosc = ilosc + ? WHERE apteka_id = ? AND lek_id = ?',
      [rezerwacja.ilosc, rezerwacja.apteka_id, rezerwacja.lek_id]
    );

    // Usuń rezerwację
    await db.run('DELETE FROM rezerwacje WHERE id = ?', [id]);

    res.json({ message: 'Rezerwacja anulowana!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd anulowania rezerwacji' });
  }
};
