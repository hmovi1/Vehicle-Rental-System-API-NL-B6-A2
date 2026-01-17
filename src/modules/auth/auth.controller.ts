import { Request, Response } from "express";
//import * as authServices from "./auth.service";
import { authServices } from "./auth.service";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const signUp = async (req: Request, res: Response)=>{
    try {
        const { name, email, password, phone, role } = req.body;
        
        if (!name || !email || !password || !phone|| !role) {
            return res.status(400).json({
                success: false,
                message: "All fields (name, email, password, phone, role) are required"
            });
        }

        const result = await authServices.signUpUserIntoDB({ name, email, password, phone, role });
    
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result.rows[0]
        })
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message || "Signup failed",
            error: error.detail || error.code
        });
    }
}



const signIn = async (req: Request, res: Response) => {
    try {
        const result = await authServices.signInUserFromDB(req.body.email,req.body.password)
          return res.status(201).json({
            success: true,
            message: "Login successful",
            data: result,
          });
}catch (error: any){
    return res.status(500).json({
        success: true,
        message: error.message,
    })
};
}

export const authController = { signUp, signIn }