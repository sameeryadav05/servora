import express, { Request, Response } from 'express'
import { ForgotPasswordController, LoginController, RefreshTokenController, ResetPasswordController, SendMailController, SignUpController} from '../controller/Auth.controller.js'
import { User } from '../model/user.model.js';
import ExpressError from '../utils/ExpressError.js';

const AuthRouter  = express.Router()

AuthRouter.post('/sendotp',SendMailController);
AuthRouter.post('/signup',SignUpController);
AuthRouter.post('/login',LoginController);
AuthRouter.post('/forgot-password',ForgotPasswordController);
AuthRouter.post('/reset-password/:token',ResetPasswordController);
AuthRouter.get('/refresh-token',RefreshTokenController);

AuthRouter.get('/profile',async (req:Request,res:Response)=>{
    const userHeader = req.headers['x-user'];
    if (!userHeader) {
        throw new ExpressError(401, "Unauthorized - No user data");
    }
    const user = JSON.parse(userHeader as string)

    const isUserExist = await User.findById(user.id);

    if(!isUserExist)
    {  
        return res.clearCookie('token',{
            httpOnly:true,
            secure:false,
            sameSite:true

        }).status(404).json({success:false,message:"user not found !"})
    }


    res.status(200).json({success:true,user})
})

export default AuthRouter

 
  