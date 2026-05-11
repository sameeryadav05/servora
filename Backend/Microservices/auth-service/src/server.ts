import app from './app.js'
import ConnectDb from './config/db.js';
import { connnectRabbitmq } from './config/rabbitmq.js';
import redis from './config/redis.js';


const PORT:number = Number(process.env.AUTH_PORT) || 3001;
const DATABASE_URI:any= process.env.MONGODB_URL;


async function  startServer()
{
    try {
        await connnectRabbitmq();
        await redis.connect();
        ConnectDb(DATABASE_URI,"Auth")

        app.listen(PORT,()=>console.log(`Auth Service Running on Port:${PORT}`))

        
    } catch (error) {
        console.log("Server StartUp Failed !",error)
        process.exit(1)
    }
}


startServer();