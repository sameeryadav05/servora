import app from "./app.js";
import { connnectRabbitmq } from "./config/rabbitmq.js";
import { startMailConsumer } from "./consumer/mail.consumer.js";

const PORT:number= Number(process.env.PORT) || 3002;


async function startServer()
{
    try {
        await connnectRabbitmq();
        await startMailConsumer();
        
        app.listen(PORT,()=>{
            console.log(`Mail Service running on port : ${PORT}`);
        })
        
    } catch (error) {
        console.log(error);
        console.log("Mail Serice StartUp Failed ")
        process.exit(1);
    }
    
}
startServer()