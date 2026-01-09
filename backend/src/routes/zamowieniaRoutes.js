import express from 'express'
import {
	createZamowienie,
	deleteZamowienie,
	getZamowienia,
	updateZamowienieStatus,
} from '../controllers/zamowieniaController.js'

const router = express.Router()

router.get('/', getZamowienia)
router.post('/', createZamowienie)
router.put('/:id/status', updateZamowienieStatus)
router.delete('/:id', deleteZamowienie)

export default router
