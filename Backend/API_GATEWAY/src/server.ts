import express from 'express'
import dotenv from 'dotenv'
dotenv.config();
import proxy from 'express-http-proxy'
import cookie_parser from 'cookie-parser'
import Auth_Middleware from './middlewares/auth.middleware.js';


const app = express();
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(cookie_parser())

const  AuthProxy = proxy('http://localhost:3001',{
    proxyReqPathResolver(req) {
        return req.originalUrl.replace('/api/auth',"")
    },
    proxyReqOptDecorator:(destinationReq,srcReq)=>{
        if(srcReq.user)
        {
            destinationReq.headers['x-user'] =   JSON.stringify( srcReq.user );
        }

        return destinationReq;
    }
})

// public routes

app.use('/api/auth/sendotp',AuthProxy)
app.use('/api/auth/signup',AuthProxy)
app.use('/api/auth/login',AuthProxy)
app.use('/api/auth/forgot-password',AuthProxy)
app.use('/api/auth/refresh-token',AuthProxy)
app.use('/api/auth/reset-password/:token',AuthProxy)

// private route
app.use('/api/auth/profile',Auth_Middleware,AuthProxy)

// app.use("/api/auth", proxy("http://localhost:3001")) // auth service proxy



// 🔥 HEALTH CHECK ROUTE
// app.get("/health", async (req, res) => {

//   const services = {
//     auth: "http://localhost:3001/health",
//     // user: "http://localhost:3002/health",
//     // booking: "http://localhost:3003/health"
//   };

//   const results: any = {};
//   let allHealthy = true;

//   await Promise.all(
//     Object.entries(services).map(async ([name, url]) => {
//       try {
//         const response = await fetch(url);
//         if (!response.ok) throw new Error();

//         results[name] = "UP";
//       } catch (err) {
//         results[name] = "DOWN";
//         allHealthy = false;
//       }
//     })
//   );

//   res.status(allHealthy ? 200 : 500).json({
//     status: allHealthy ? "UP" : "DOWN",
//     services: results,
//     timestamp: new Date().toISOString()
//   });
// });

const PORT: number = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`API Gateway Running on Port : ${PORT}`));