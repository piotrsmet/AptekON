import express from 'express';
import { getZaopatrzenie, createZaopatrzenie, updateZaopatrzenie } from '../controllers/zaopatrzenieController.js';

const router = express.Router();

router.get('/', getZaopatrzenie);
router.post('/', createZaopatrzenie);
router.put('/:id', updateZaopatrzenie);

export default router;
