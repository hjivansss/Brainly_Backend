import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env
const JWT_PASSWORD = process.env.JWT_PASSWORD as string;

import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { UserModel,ContentModel, LinkModel} from "./db";
import { userMiddleware } from "./middleware"; // Import the user middleware for authentication

import { random } from "./utils"; // Import the random function from utils
import cors from "cors";

// Import Zod for input validation(checking if the input has the correct format)
//const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";

const app = express();
app.use(express.json());//This middleware is used to parse JSON bodies in requests
app.use(cors());



// 7. Get Shared Brain Route/Endpoint of other users:
app.get("/api/v1/brain/:sharelink",async (req,res)=>{
    const hash = req.params.sharelink; // Get the share link from the URL parameters
    // Find the link in the database using the hash
    const link = await LinkModel.findOne({ hash:hash });
    if (!link) {
        res.status(404).json({ message: "Invalid share link" }); // Send error if not found.
        return;
    }
    // Checking the hash -console.log(hash);
    // Fetch content and user details for the shareable link from link table.
    const content = await ContentModel.find({ userId: link.userId });
    const user = await UserModel.findOne({ _id: link.userId });

    if (!user) {
        res.status(404).json({ message: "User not found" }); // Handle missing user case.
        return;
    }
    const sanitizedContent = content.map(({title,link,type})=>({
        
        title,
        link,
        type,
        
        
    })) ;
     
    //Checking the content sent - console.log(sanitizedContent)
    res.json({
        hash:hash,
        username: user.username,
        content:sanitizedContent
    }); // Send user and content details in response.
   
})


//Zod validation schema
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// 1. Signup Route/Endpoint:
app.post("/api/v1/signup",async (req: Request,res:Response)=>{
    
    // 1. Validate input with Zod
  const parseResult = signupSchema.safeParse(req.body);

  if (!parseResult.success) {
      res.status(400).json({
      message: "Invalid input",
      errors: parseResult.error.errors.map(e => e.message),
    });
  }else{
        const { username, password } = parseResult.data;
        // 2. Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            // 3. Save the user to the database
            await UserModel.create({
            username: username,
            password: hashedPassword,
            });

            res.json({
            message: "User signed up successfully",
            });
        } catch (error) {
            // 4. Handle duplicate username error
            res.status(409).json({
            message: "Error signing up: Duplicate username",
            });
        }
     }
    })


//
const signinSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});
// 2. Signin Route/Endpoint:
app.post("/api/v1/signin",async (req:Request,res:Response)=>{
       // 1. Validate input using Zod
  const parseResult = signinSchema.safeParse(req.body);

  if (!parseResult.success) {
      res.status(400).json({
      message: "Invalid input",
      errors: parseResult.error.errors.map((e) => e.message),
    });
  }else{
        const { username, password } = parseResult.data;
        // 2. Find user
        const existingUser = await UserModel.findOne({ username });

        if (!existingUser) {
             res.status(403).json({ message: "Invalid username or password" });
        }else{

                // 3. Compare passwords
                const isPasswordValid = await bcrypt.compare(password, existingUser.password);

                if (!isPasswordValid) {
                    res.status(403).json({ message: "Invalid username or password" });
                }

                // 4. Generate JWT token
                const token = jwt.sign({ id: existingUser._id }, JWT_PASSWORD);
                res.json({ token });
     }
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
app.delete("/api/v1/content/:id",userMiddleware,async (req,res)=>{
    const contentId = req.params.id;

    const result = await ContentModel.deleteOne({
        _id:contentId,
        userId:req.userId //Making sure that the content belongs to the user who is trying to delete it
    })
    console.log(contentId);
    if(result.deletedCount===0){
        return 
        res.status(403).json({
            message:"Not your content"
        })
    }
    res.status(200).json({message:"Deleted"})
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

           {
            /* // 7. Get Shared Brain Route/Endpoint of other users:
            app.get("/api/v1/brain/:sharelink",async (req,res)=>{
                const hash = req.params.sharelink; // Get the share link from the URL parameters
                // Find the link in the database using the hash
                const link = await LinkModel.findOne({ hash });
                if (!link) {
                    res.status(404).json({ message: "Invalid share link" }); // Send error if not found.
                    return;
                }

                // Fetch content and user details for the shareable link.
                const content = await ContentModel.find({ userId: link.userId });
                const user = await UserModel.findOne({ _id: link.userId });

                if (!user) {
                    res.status(404).json({ message: "User not found" }); // Handle missing user case.
                    return;
                }

                res.json({
                    username: user.username,
                    content
                }); // Send user and content details in response.
            
            })
           */
          }


const PORT = process.env.PORT || 4000;
app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`)
})
