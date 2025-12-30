import express from 'express';
import { getRezerwacje, getRezerwacjeByApteka, createRezerwacja, cancelRezerwacja } from '../controllers/rezerwacjeController.js';

const router = express.Router();

router.get('/', getRezerwacje);
router.get('/apteka', getRezerwacjeByApteka);
router.post('/', createRezerwacja);
router.delete('/:id', cancelRezerwacja);

export default router;
