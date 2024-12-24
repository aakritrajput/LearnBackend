//require('dotenv').config({path:'./env'}) // in consig give an object that contains path of the env 
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
 .then(()=>{
    app.on("error", (error)=>{     // listener after database connects for any error 
        console.log("ERROR:", error)
        throw error
    })
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
 })
 .catch((error)=>{
    console.log("MONGO db connection failed!!! ", error)
 })


























/*
( async()=>{
    try {
        await mongoose.connect(`${process.env.MMONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{     // listener after database connects 
            console.log("ERROR:", error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("Error:",error)
        throw error;
    }
})()

*/
