import express from 'express';
import { getApteki, createApteka, getAptekaById, updateAptekaOwner, getAptekaZaopatrzenie } from '../controllers/aptekiController.js';

const router = express.Router();

router.get('/', getApteki);
router.post('/', createApteka);
router.get('/:id', getAptekaById);
router.patch('/:id', updateAptekaOwner);
router.get('/:id/zaopatrzenie', getAptekaZaopatrzenie);

export default router;
