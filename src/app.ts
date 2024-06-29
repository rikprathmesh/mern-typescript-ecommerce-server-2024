import express from "express"
import { connectDB } from "./utils/features.js"
import { errorMiddleware } from "./middlewares/error.js"
import NodeCache from 'node-cache';
import {config} from 'dotenv'
import morgan from 'morgan'
import Stripe from "stripe";
import cors from "cors"

// importing routes
import userRoutes from './routes/user.js'
import proudctRoutes from './routes/products.js'
import orderRoutes from './routes/order.js'
import paymentRoutes from './routes/payment.js'
import dashboardRoutes from './routes/stats.js'

config({
    path: "./.env"
})

const port = process.env.PORT || 3000
const mongoURI = process.env.MONGO_URI || '';
const stripeKey = process.env.STRIPE_KEY || '';

connectDB(mongoURI)

export const stripe = new Stripe(stripeKey)

export const nodeCache = new NodeCache()

// created app
const app = express()

// middleware to read the req body json data 
app.use(express.json())

app.use(morgan("dev"))

// to prevent cors error
// app.use(cors({
//     origin: [],
//     methods: []
// }))
app.use(cors())

app.get("/", (req, res) => {
    res.send("API Working With /api/v1")
})

// using routes
app.use('/api/v1/user', userRoutes)
app.use('/api/v1/product', proudctRoutes)
app.use('/api/v1/order', orderRoutes)
app.use('/api/v1/payment', paymentRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)

app.use("/uploads", express.static("uploads"))


// this function always have to call in end
// middleware to handle error
app.use(errorMiddleware)


// listening to the app
app.listen(port, () => {
    console.log(`server is working on http://localhost:${port}`);
    
})