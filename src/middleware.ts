import { NextFunction,Request,Response } from "express";    
import jwt from "jsonwebtoken";
import {JWT_PASSWORD} from "./config"; // Import the JWT secret from config

// Middleware to authenticate user based on JWT token
export const userMiddleware = async (req: Request,res : Response,next: NextFunction)=> {
    // Get the token from the Authorization header
    const header =req.headers["authorization"];//Extract the "authorzation" header from the request headers

     // Verify the JWT token using the JWT_PASSWORD secret key.
     const decoded =jwt.verify(header as string,JWT_PASSWORD);

     if(decoded){
        //@ts-ignore            //Todo:override the type of the global request object 
        req.userId=decoded.id ; // If the token is valid, set the userId in the request object4
        next();                 // Call the next middleware or route handler
     }else{
         res.status(401).json({ message: "Unauthorized User" });
     }
    };