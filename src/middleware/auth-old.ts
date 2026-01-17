import { NextFunction, Request, Response } from "express";
import  jwt, { JwtPayload }  from "jsonwebtoken";
import { pool } from "../database/db";





export const auth = (...roles : ('admin' | 'customer')[]) => {
    return async (req: Request, res: Response, next: NextFunction)=>{
        const token = req.headers.authorization;
        const secret = process.env.JWT_SECRET as any;
        if(!token){
            throw new Error("Not authorized"); 
        }
        const decoded = jwt.verify(token, secret) as JwtPayload;
        const user = await pool.query(
            `
            SELECT * FROM users WHERE email=$1
            `,[decoded.email]
        )
        if(user.rows.length === 0){
            throw new Error("User not found");
        }
        
        req.user = decoded
        if(roles.length && !roles.includes(decoded.role)){
            throw new Error("You are not authorized!");
        }
        next();
    };
};