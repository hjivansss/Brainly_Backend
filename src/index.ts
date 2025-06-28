import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { UserModel,ContentModel, LinkModel} from "./db";
import { JWT_PASSWORD} from "./config"; // Import the JWT secret from config
import { userMiddleware } from "./middleware"; // Import the user middleware for authentication
import {z} from "zod"; // Import Zod for input validation(checking if the input has the correct format)
//const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
import { random } from "./utils"; // Import the random function from utils
import cors from "cors";


const app = express();
app.use(express.json());//This middleware is used to parse JSON bodies in requests
app.use(cors());

// 1. Signup Route/Endpoint:
app.post("/api/v1/signup",async (req,res)=>{
    //Todo: Add ZOD for input validation here and hash the password before storing it in the database. 
    const username=req.body.username;
    const password=req.body.password;

            try {
                await UserModel.create({
                username: username,
                password: password
                });
                res.json({
                message:"User signed up successfully"
                });
            }catch (error){
                //Handle error for duplicate usernames
                res.status(409).json({
                message: "Error signingup : Duplicate username",
                })
        }
    })


// 2. Signin Route/Endpoint:
app.post("/api/v1/signin",async (req,res)=>{
    const username=req.body.username;
    const password=req.body.password;

    //check if the user exists or not
    const existingUser = await UserModel.findOne({
        username: username,
        password: password
    })

    if(existingUser){
        //Generate jwt token
        const token = jwt.sign({
            id: existingUser.id
        },JWT_PASSWORD)
        //Return the token to the user
        res.json({
            token
        })
    }else{
        res.status(403).json({
            message: "Invalid username or password"
        })
    }
})


// 3. Add Content Route/Endpoint:Here we use middleware to check if the user is singined in and has sent a valid token
app.post("/api/v1/content",userMiddleware,async (req,res)=>{
    const link=req.body.link;
    const title=req.body.title;
    const type=req.body.type;
           await ContentModel.create({
                title:title,
                link:link,
                type:type,
                userId:req.userId ,
                tags:[]
            })
            res.json({
                message:"Content added successfully",
            })
    })

// 4. Get Content Route/Endpoint:
app.get("/api/v1/content",userMiddleware,async (req,res)=>{
    const userId = req.userId; // Get the userId from the request object set by the middleware
    // The `populate` function is used to include additional details from the referenced `userId`.
    // For example, it will fetch the username linked to the userId.
    // Since we specified "username", only the username will be included in the result, 
    // and other details like password won’t be fetched.
    const content = await ContentModel.find({userId:userId}).populate("userId","username");
    res.json({content})
})

// 5. Delete Content Route/Endpoint:
app.delete("/api/v1/content",async (req,res)=>{
    const contentId = req.body.contentId;
    await ContentModel.deleteMany({
        id:contentId,
        userId:req.userId //Making sure that the content belongs to the user who is trying to delete it
    })
})

// 6. Share Your Brain Route/Endpoint:
app.post("/api/v1/brain/share",userMiddleware,async (req,res)=>{
    const share = req.body.share;//True or false
        if(share){
                //Check if the user already has a shareable link
                const existingLink = await LinkModel.findOne({userId:req.userId});
                if(existingLink){
                            //If the user already has a shareable link, we will return the existing link
                            res.json({hash: existingLink.hash})
                            return;
                }
        const hash = random(10);
        //If new user wants to share their brain, we will create a link or hash for them
        await LinkModel.create({userId: req.userId,hash})
        res.json({hash})
        } //Disabling the url
          else{
         await LinkModel.deleteOne({
                userId:req.userId
            })
            res.json({
                message:"Disabled shareable link"
            })
    }

})

// 7. Get Shared Brain Route/Endpoint of other users:
app.get("/api/v1/brain/:sharelink",async (req,res)=>{
    const hash = req.params.sharelink; // Get the share link from the URL parameters
    // Find the link in the database using the hash
    const link = await LinkModel.findOne({hash:hash});

    if(!link){
        res.status(411).json({message:"Sorry Incorrect Input"})
        return
    }

    //Find the content of the user who shared their brain
    const content = await ContentModel.find({userId:link.userId})

    //Find the user who shared their brain 
    const user = await UserModel.findOne({_id:link.userId});

    if(!user){
        res.status(411).json({
            message:"User not found,error should ideally not happen"
        })
        return;
    }

    // Return the content and user details
    res.json({
        username:user?.username,// Optional chaining to avoid errors if user is not found
        content:content
    })
})


app.listen(4000);