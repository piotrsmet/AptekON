import express from 'express'
import {
	getApteki,
	createApteka,
	getAptekaById,
	updateAptekaOwner,
	getAptekaZaopatrzenie,
	getNajblizszaApteka,
	getNajblizszaAptekaZLekiem,
} from '../controllers/aptekiController.js'

const router = express.Router()

router.get('/najblizsza', getNajblizszaApteka)
router.get('/najblizsza-z-lekiem', getNajblizszaAptekaZLekiem)

router.get('/', getApteki)
router.post('/', createApteka)
router.get('/:id', getAptekaById)
router.patch('/:id', updateAptekaOwner)
router.get('/:id/zaopatrzenie', getAptekaZaopatrzenie)

export default router
