import express from 'express'
import {
	getZaopatrzenie,
	createZaopatrzenie,
	updateZaopatrzenie,
	deleteZaopatrzenie,
} from '../controllers/zaopatrzenieController.js'

const router = express.Router()

router.get('/', getZaopatrzenie)
router.post('/', createZaopatrzenie)
router.put('/:id', updateZaopatrzenie)
router.delete('/:id', deleteZaopatrzenie)

export default router
