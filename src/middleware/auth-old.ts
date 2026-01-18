/*import { NextFunction, Request, Response } from "express";
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
};*/

import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { pool } from "../database/db";

export const auth = (...roles: ('admin' | 'customer')[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Check if authorization header exists
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "No authorization token provided"
        });
      }

      // 2. Extract token (handle "Bearer token" format)
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      // 3. Check if JWT_SECRET exists
      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        console.error("JWT_SECRET is not defined in environment variables");
        return res.status(500).json({
          success: false,
          message: "Server configuration error"
        });
      }

      // 4. Verify token
      const decoded = jwt.verify(token, secret) as JwtPayload;

      // 5. Verify user exists in database
      const user = await pool.query(
        `SELECT id, email, role FROM users WHERE email=$1`,
        [decoded.email]
      );

      if (user.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }

      // 6. Attach user to request
      req.user = decoded;

      // 7. Check role authorization
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this resource"
        });
      }

      // 8. Continue to next middleware/route handler
      next();

    } catch (error: any) {
      console.error("Auth middleware error:", error);

      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: "Invalid token"
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Token has expired"
        });
      }

      // Handle database errors
      if (error.code) {
        return res.status(500).json({
          success: false,
          message: "Database error during authentication"
        });
      }

      // Generic error
      return res.status(500).json({
        success: false,
        message: "Authentication failed"
      });
    }
  };
};