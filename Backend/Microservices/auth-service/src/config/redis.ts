

import  {createClient} from 'redis'

const redis = createClient({
  url:"redis://default:sameer_2005@13.206.95.140:6379"
})

redis.on('connect',()=>{
  console.log("Redis Connected !");
})

redis.on('error',(error)=>console.log(error));

export default redis;
