
import otp from 'otp-generator'

import { IUser, User } from "../model/user.model.js";
import ExpressError from "../utils/ExpressError.js";


export const otp_service = async (data:IUser):Promise<string>=>
{
    const isExist = await User.findOne({email:data.email});

    if(isExist)
    {
        throw new ExpressError(409,"Email Already Exist , please login to continue !")
    }

    const newOTP = otp.generate(4,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false
    })

    return newOTP;

}