import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// przykładowa trasa
app.get("/api/matches", (req, res) => {
  res.json([
    { id: 1, teamA: "Real Madrid", teamB: "Barcelona", oddsA: 2.1, oddsB: 3.2 },
    { id: 2, teamA: "Arsenal", teamB: "Chelsea", oddsA: 1.9, oddsB: 2.8 },
  ]);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server działa na porcie ${PORT}`));