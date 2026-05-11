import express,{Request,Application, NextFunction, Response} from 'express';
import dotenv from 'dotenv'
dotenv.config();
import morgan from 'morgan'
import ExpressError from './utils/ExpressError.js';
import mongoose from 'mongoose';
import redis from './config/redis.js';
import AuthRouter from './routes/Auth.router.js';
import { RabbitMQ_Status } from './config/rabbitmq.js';
import cookieparser from 'cookie-parser'

const app:Application = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan('dev'));
app.use(cookieparser())

app.use('/',AuthRouter);
app.get('/health',async (req,res)=>{
    try {
        // Db connection Checking
        await mongoose.connection.db?.admin().ping();
        const redisStatus = await redis.ping();
        const uptimeSeconds = process.uptime();
        const seconds = Math.floor(uptimeSeconds % 60)
        const minutes = Math.floor((uptimeSeconds / 60) % 60)
        const hours   = Math.floor(uptimeSeconds / 3600)
        res.status(200).json({
            success:true,
            service:"Auth Service",
            status:"UP",
            RabbitMQ:RabbitMQ_Status?"UP":"DOWN",
            redis:redisStatus === "PONG" ? "UP" : "DOWN",
            uptime:`${hours} hr : ${minutes} min : ${seconds} sec`,
            timestamp:new Date().toISOString()
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            status: "DOWN",
            message: "Service unhealthy"
        });
    }
})

// 404 Handler
app.use((req:Request,res:Response,next:NextFunction)=>{
    next(new ExpressError(404,"Resource Not Found !"));
})

// global Error Handler
app.use((err:ExpressError,req:Request,res:Response,next:NextFunction)=>{
    const { status=500 , message="Internal Server Error !" } = err
    
    res.status(status).send(message);
})





export default app