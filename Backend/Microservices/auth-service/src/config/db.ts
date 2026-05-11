import mongoose from 'mongoose'


async function ConnectDb(connectionString:string,dbName:string):Promise<void>{
    try {
        await mongoose.connect(connectionString,{dbName})
        console.log('Auth Database Connected')
        
    } catch (error) {
        console.log('Database Connection Failed !',error);
        process.exit(1);
    }
}

export default ConnectDb;