import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express()

// configuring all middlewares or can say incoming or outgoing data 
app.use(cors({ 
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))              // this app.use method is used in all types of middlewares or configuration use

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

export {app}