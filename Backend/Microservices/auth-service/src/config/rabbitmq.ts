import amqp,{Connection,Channel} from 'amqplib'


let connection:any;
let channel:Channel;
export const Queue:string = "mail_queue";
export let RabbitMQ_Status:boolean=false;

export async function connnectRabbitmq()
{
    try {
        connection = await amqp.connect('amqp://sameer:sameer_2005@localhost:5672')
        channel = await connection.createChannel();
        await channel.assertQueue(Queue,{durable:true})
        console.log('RabbitMQ Connected !')
        RabbitMQ_Status=true

        connection.on('error',(err:any)=>{
            console.log(err);
            RabbitMQ_Status=false;
        })

        connection.on('close',()=>{
            console.log("RabbitMQ Disconnected !");
            RabbitMQ_Status=false;
        })

    } catch (error) {
        console.log("Failed to Connect RabbitMQ !");
        RabbitMQ_Status=false
    }
}


export function getChannel (): Channel
{
   return channel; 
}