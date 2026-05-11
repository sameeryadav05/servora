

import  {createClient} from 'redis'
import dotenv from 'dotenv'
dotenv.config();

const redis = createClient({
  url:process.env.REDIS_URL!,
})

redis.on('connect',()=>{
  console.log("Redis Connected !");
})

redis.on('error',(error)=>console.log(error));

export default redis;
