import express from 'express';
import { getLeki, getLekiSuggestions, getLekById } from '../controllers/lekiController.js';

const router = express.Router();

router.get('/', getLeki);
router.get('/suggestions', getLekiSuggestions);
router.get('/:id', getLekById);

export default router;
