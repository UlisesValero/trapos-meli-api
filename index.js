import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

import connectDB from './config/db.js'
import meliRoutes from './routes/meliRoutes.js'

const app = express()
app.use(cors())
app.use(express.json())

connectDB()

app.use('/api', meliRoutes)

const PORT = process.env.PORT
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))