import { JWT_PASSWORD } from "./config";
//Schemas 
import mongoose,{model,Schema} from "mongoose";
mongoose.connect("mongodb+srv://hjivansingha1234:4px3fp531tHLsUQK@cluster0.svhzdut.mongodb.net/Brainly");

// Defining the schema for the user
const userSchema = new Schema({
    username:{type:String,unique:true,required:true},
    password:{type:String,required:true},
});
// Creating the model for the user,Asigning the name 'User' to the model and exporting it
export const UserModel = model("User",userSchema);


// Defining the schema for the Content
const contentSchema= new Schema({
    title:{type:String,required:true},
    link:{type:String},
    type:String,
    tags:[{type:mongoose.Types.ObjectId,ref:'Tag'}],//Its an array of ObjectIds that takes reference from the Tag model
    userId:{type:mongoose.Types.ObjectId,ref:'User',required:true},//Its an ObjectId that takes reference from the User model
    })
// Creating the model for the Content,Asigning the name 'Content' to the model and exporting it
export const ContentModel = model("Content",contentSchema);


// Defining the schema for the Tag


//Defining the schema for the link
const linkSchema = new Schema({
    hash:String,
    userId:{type:mongoose.Types.ObjectId ,ref:'User', required:true,unique:true},
})
// Creating the model for the link,Asigning the name 'Link' to the model and exporting it
export const LinkModel = model("Link",linkSchema);