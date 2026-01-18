import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { pool } from "../database/db";

export const auth = (...roles: ('admin' | 'customer')[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "No authorization token provided"
        });
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        console.error("JWT_SECRET is not defined in environment variables");
        return res.status(500).json({
          success: false,
          message: "Server configuration error"
        });
      }

      const decoded = jwt.verify(token, secret) as JwtPayload;

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

      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this resource"
        });
      }

      next();

    } catch (error: any) {
      console.error("Auth middleware error:", error);

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

      if (error.code) {
        return res.status(500).json({
          success: false,
          message: "Database error during authentication"
        });
      }

      return res.status(500).json({
        success: false,
        message: "Authentication failed"
      });
    }
  };
};