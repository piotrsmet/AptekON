import express from 'express'
import cors from 'cors'
import SwaggerUI from 'swagger-ui-express'
import YAML from 'yamljs'
import path from 'path'
import { initDb } from './src/config/db.js'

import aptekiRoutes from './src/routes/aptekiRoutes.js'
import usersRoutes from './src/routes/usersRoutes.js'
import authRoutes from './src/routes/authRoutes.js'
import lekiRoutes from './src/routes/lekiRoutes.js'
import zaopatrzenieRoutes from './src/routes/zaopatrzenieRoutes.js'
import rezerwacjeRoutes from './src/routes/rezerwacjeRoutes.js'
import zamowieniaRoutes from './src/routes/zamowieniaRoutes.js'

const app = express()
const swaggerDocument = YAML.load('./swagger.yaml')
app.use(cors())
app.use(express.json())
app.use('/api', SwaggerUI.serve, SwaggerUI.setup(swaggerDocument))

const __dirname = path.resolve()
app.use(express.static(path.join(__dirname, '../frontend', 'dist')))

app.use('/apteki', aptekiRoutes)
app.use('/uzytkownicy', usersRoutes)
app.use('/auth', authRoutes)
app.use('/leki', lekiRoutes)
app.use('/zaopatrzenie', zaopatrzenieRoutes)
app.use('/rezerwacje', rezerwacjeRoutes)
app.use('/zamowienia', zamowieniaRoutes)

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'))
})

const PORT = 5000
initDb()
	.then(() => {
		app.listen(PORT, () => console.log(`Server działa na porcie ${PORT}`))
	})
	.catch(err => {
		console.error('Błąd przy inicjalizacji bazy:', err)
	})
