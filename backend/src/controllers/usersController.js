import { getDb } from "../config/db.js";
import bcrypt from "bcryptjs";

export const createUser = async (req, res) => {
  try {
    const db = getDb();
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
};

export const getUsers = async (req, res) => {
  try {
    const db = getDb();
    const users = await db.all('SELECT id, email, admin FROM uzytkownicy');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania użytkowników' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const db = getDb();
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
};

export const login = async (req, res) => {
  try {
    const db = getDb();
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
};
