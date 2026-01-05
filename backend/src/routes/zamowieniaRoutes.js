import express from 'express'
import {
	createZamowienie,
	deleteZamowienie,
	getZamowienia,
} from '../controllers/zamowieniaController.js'

const router = express.Router()

router.get('/', getZamowienia)
router.post('/', createZamowienie)
router.delete('/:id', deleteZamowienie)

export default router
