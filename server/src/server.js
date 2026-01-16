import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import videoRoutes from "./routes/video.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/video", videoRoutes);


connectDB().then(()=>{
    app.listen(process.env.PORT || 5000,()=>
    console.log("server running....."));
}).catch(err=>console.log(err));