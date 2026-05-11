import jwt, { JwtPayload } from 'jsonwebtoken'
import {Response,Request,NextFunction} from 'express'




export async function Auth_Middleware(req:Request,res:Response,next:NextFunction)
{
    const JWT_SECRET:string = process.env.ACCESS_JWT_SECRET!;
    try {
        const token = req.headers.authorization?.split(" ")[1] || req.body.AccessToken;


        if(!token) {
            return res.status(401).json({success:false,message:"Unauthorized : Token Not Found !"})
        }

        const decoded:JwtPayload = jwt.verify(token,JWT_SECRET,{
            issuer:'Auth-Service',
            audience:'user',
        }) as JwtPayload

        req.user = {
            id:decoded.id,
            fullName:decoded.fullName,
            email:decoded.email,
            role:decoded.role
        }

        // console.dir(req.user)

        next();
    } 
    catch (error) {
        return res.status(401).json({success:false,message: "Unauthorized: Invalid or expired token"})
    }
}

export default Auth_Middleware;