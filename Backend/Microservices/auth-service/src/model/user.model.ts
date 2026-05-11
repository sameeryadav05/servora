import mongoose from "mongoose";
import bcrypt from 'bcrypt'

export interface IUser {
    fullName:string
    email:string;
    password:string;
    role:"User" | "Worker" | "Admin",
}

const userSchema = new mongoose.Schema<IUser>({
    fullName:{
        type:String,
        trim:true,
        required:[true,"fullName field is missing"],
    },
    email:{
        type:String,
        trim:true,
        required:[true,"Email field is missing"],
        unique:true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please use a valid email"]
    },
    password:{
        type:String,
        required:[true,"Password field is missing"],
        select:false,
    },
    role:{
        type:String,
        enum:["User","Worker","Admin"],
        default:"User",
        trim:true,
        required:[true,"Role field is missing"],
    }
},{timestamps:true})

userSchema.pre('save',async function(){
    if(!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
})

export const User = mongoose.model<IUser>('User',userSchema);