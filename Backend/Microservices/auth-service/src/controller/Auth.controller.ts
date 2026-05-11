import { Request ,Response} from "express";
import wrapAsync from "../utils/WrapAsync.js";
import { IUser, User } from "../model/user.model.js";
import ExpressError from "../utils/ExpressError.js";
import { otp_service } from "../services/otp.service.js";
import redis from "../config/redis.js";
import { getChannel, Queue } from "../config/rabbitmq.js";
import { generateAccessToken, generateRefreshToken, UserPayload, verifyRefreshToken } from "../utils/jwt.js";
import bcrypt from 'bcrypt'
import crypto from 'crypto'


export const SendMailController =  wrapAsync(async function(req:Request,res:Response)
{
    
    const {fullName,email,password,role} = req.body as IUser;

    if(!fullName || !email || !password || !role)
    {
        return res.status(400).json({
            success:false,
            message:"Input field's are Missing !"
        })
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[^\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!email.trim().match(emailRegex))
    {
        throw new ExpressError(422,"Invalid Email Format")
    }
    if(!password.trim().match(passwordRegex))
    {
        throw new ExpressError(422,"Password must contain a special character , a alphabet ,a numeric , and no white space");
    }
    if(password.length <8)
    {
        throw new ExpressError(422,"Password must contain minimum 8 character");
    }

    const user = await User.findOne({email});
    if(user)
    {
        throw new ExpressError(409,"User Already Exist , please Login to continue");
    }

    const data:IUser = {
        fullName,email,password,role
    }

    const existingOtp = await redis.get(`otp:${email}`);

    if (existingOtp) {
    return res.status(429).json({
        success: false,
        message: "OTP already sent. Please wait before requesting again."
    });
    }

    const otp:string = await otp_service(data);
    // const RedisotpData = {
    //     fullName,
    //     email,
    //     otp
    // }
    
    await redis.set(`otp:${email}`,otp,{EX:300})


    // pass message to email service
    const channel = getChannel()
    try {
        channel.sendToQueue(Queue,Buffer.from(JSON.stringify({
        type:"SIGNUP_OTP",
        payload:{
            email,
            fullName,
            otp
        }
    })),{persistent:true});
    } 
    catch (error) {
        throw new ExpressError(500, "Message queue not available");
    }
    
    res.status(201).json({
        success:true,
        message:"OTP Sent Successfully",
        email
    })
})

export const SignUpController = wrapAsync(async function(req:Request,res:Response){

    const {fullName,email,password,role,otp} = req.body;

    if(!fullName || !email || !password || !role || !otp)
    {
        return res.status(400).json({
            success:false,
            message:"Input field's are Missing !"
        })
    }

    const RedisOtp = await redis.get(`otp:${email}`);
    if(!RedisOtp)
    {
        return res.status(401).json({
            success:false,
            message:"OTP Expired !"
        })
    }

    if(String(otp) !== RedisOtp)
    {
        return res.status(401).json({
            success:false,
            message:"Invalid OTP !"
        })
    }
    await redis.del(`otp:${email}`)

    let user = await User.findOne({email})
    if(user)
    {
        throw new ExpressError(409,"User Already Exist , please Login to continue");
    }

    user = await User.insertOne({
        fullName,
        email,
        password,
        role,
    })
    const payload: UserPayload = {
        id:user._id.toString(),
        fullName,
        email,
        role
    }
    
    const AccessToken = generateAccessToken(payload);

    const RefreshToken = generateRefreshToken(payload)
    res
    .cookie('refresh_token',RefreshToken,
        {
            maxAge:7*24*60*60*1000,
            httpOnly:true,
            secure:false,
            sameSite:"strict"
        }
    )
    .status(201)
    .json({
        success:true,
        message:`Welcome ${fullName} to Urban Service`,
        AccessToken
    })
    
})


export const LoginController = wrapAsync(async function(req:Request,res:Response)
{
    const {password,email}= req.body
    const isUserExist = await User.findOne({email}).select('+password')
    if(!isUserExist)
    {
        throw new ExpressError(404,"User Not Found !");
    }

    const HashedPassword = isUserExist.password;

    const isPasswordCorrect = await bcrypt.compare(password,HashedPassword);
    if(!isPasswordCorrect)
    {
        throw new ExpressError(422,"Incorrect Password");
    }

    const payload = {
        id:isUserExist._id.toString(),
        fullName:isUserExist.fullName,
        email:isUserExist.email,
        role:isUserExist.role,
    }
    const AccessToken = generateAccessToken(payload);
    const RefreshToken = generateRefreshToken(payload);
    res.cookie('refresh_token',RefreshToken,
        {
            maxAge:7*24*60*60*1000,
            httpOnly:true,
            secure:false,
            sameSite:"strict"
        }
    )
    .status(200 )
    .json({
        success:true,
        user:payload,
        message:`Welcome Back , ${isUserExist.fullName} !`,
        AccessToken
    })
})

export const ForgotPasswordController = wrapAsync(async function(req:Request,res:Response){
    const {email} = req.body

    const user = await User.findOne({email})

    if(!user)
    {
        return res.status(404).json({success:false,message:"User Not Found !"})
    }

    // generate reset token -> save reset token to redis for 10 min -> send reset token to user via mail -> userClicks , reset password page appers -> frontend send token and new password -> backend verify toke 

    const resetToken = crypto.randomBytes(32).toString('hex');

    await redis.set(`reset:${resetToken}`,user._id.toString(),{EX:600});

    const ClientBaseUrl = process.env.CLIENT_URI || 'http://localhost:5173'

    const resetLink = `${ClientBaseUrl}/${resetToken}`

    const msg = {
        email,
        resetLink
    }

    const channel = getChannel()
    if(!channel)
    {
        throw new ExpressError(500,"RabbitMQ channel Not found !");
    }

    try {
        channel.sendToQueue(Queue,
            Buffer.from(JSON.stringify({
                type:"RESET_PASSWORD",
                payload:{
                    email,
                    resetLink,
        }
            })),
            {persistent:true}
        )

  


        return res.status(200).json({success:true,
            message:"Reset Link send to you email"
        })
        
    } 
    catch (error) {
        throw new ExpressError(500, "Message queue not available");
    }


})



export const ResetPasswordController = wrapAsync(async (req:Request,res:Response)=>{
    const {token} = req.params
    const {newpassword} = req.body

    const userId = await redis.get(`reset:${token}`);

    if(!userId)
    {
       return res.status(400).json({
        success:false,
        message:"Invalid or Expired Reset Link Found"
       })
    }

    const user = await User.findById(userId).select('+password')
    if (!user) throw new ExpressError(404, "User not found");
    user.password = newpassword;
    await user.save();

    await redis.del(`reset:${token}`)

    res.json({success:true,message:"password reset successfully !"})
})


export const RefreshTokenController = wrapAsync(
  async (req: Request, res: Response) => {

    // 1️⃣ Get refresh token from cookie
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found"
      });
    }

    // 2️⃣ Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }

    // 3️⃣ Check user exists
    const user = await User.findById(decoded.id);

    if (!user) {

      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: false,
        sameSite: "strict"
      });

      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 4️⃣ Create NEW access token
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role
    });

    // OPTIONAL 🔥 refresh token rotation
    // const newRefreshToken = generateRefreshToken(...)

    // 5️⃣ Return new access token
    return res.status(200).json({
      success: true,
      accessToken
    });
  }
);