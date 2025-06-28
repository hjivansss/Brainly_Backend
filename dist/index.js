"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const config_1 = require("./config"); // Import the JWT secret from config
const middleware_1 = require("./middleware"); // Import the user middleware for authentication
//const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
const utils_1 = require("./utils"); // Import the random function from utils
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json()); //This middleware is used to parse JSON bodies in requests
app.use((0, cors_1.default)());
// 1. Signup Route/Endpoint:
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Todo: Add ZOD for input validation here and hash the password before storing it in the database. 
    const username = req.body.username;
    const password = req.body.password;
    try {
        yield db_1.UserModel.create({
            username: username,
            password: password
        });
        res.json({
            message: "User signed up successfully"
        });
    }
    catch (error) {
        //Handle error for duplicate usernames
        res.status(409).json({
            message: "Error signingup : Duplicate username",
        });
    }
}));
// 2. Signin Route/Endpoint:
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    //check if the user exists or not
    const existingUser = yield db_1.UserModel.findOne({
        username: username,
        password: password
    });
    if (existingUser) {
        //Generate jwt token
        const token = jsonwebtoken_1.default.sign({
            id: existingUser.id
        }, config_1.JWT_PASSWORD);
        //Return the token to the user
        res.json({
            token
        });
    }
    else {
        res.status(403).json({
            message: "Invalid username or password"
        });
    }
}));
// 3. Add Content Route/Endpoint:Here we use middleware to check if the user is singined in and has sent a valid token
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = req.body.link;
    const title = req.body.title;
    const type = req.body.type;
    yield db_1.ContentModel.create({
        title: title,
        link: link,
        type: type,
        userId: req.userId,
        tags: []
    });
    res.json({
        message: "Content added successfully",
    });
}));
// 4. Get Content Route/Endpoint:
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId; // Get the userId from the request object set by the middleware
    // The `populate` function is used to include additional details from the referenced `userId`.
    // For example, it will fetch the username linked to the userId.
    // Since we specified "username", only the username will be included in the result, 
    // and other details like password won’t be fetched.
    const content = yield db_1.ContentModel.find({ userId: userId }).populate("userId", "username");
    res.json({ content });
}));
// 5. Delete Content Route/Endpoint:
app.delete("/api/v1/content", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentId = req.body.contentId;
    yield db_1.ContentModel.deleteMany({
        id: contentId,
        userId: req.userId //Making sure that the content belongs to the user who is trying to delete it
    });
}));
// 6. Share Your Brain Route/Endpoint:
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share; //True or false
    if (share) {
        //Check if the user already has a shareable link
        const existingLink = yield db_1.LinkModel.findOne({ userId: req.userId });
        if (existingLink) {
            //If the user already has a shareable link, we will return the existing link
            res.json({ hash: existingLink.hash });
            return;
        }
        const hash = (0, utils_1.random)(10);
        //If new user wants to share their brain, we will create a link or hash for them
        yield db_1.LinkModel.create({ userId: req.userId, hash });
        res.json({ hash });
    } //Disabling the url
    else {
        yield db_1.LinkModel.deleteOne({
            userId: req.userId
        });
        res.json({
            message: "Disabled shareable link"
        });
    }
}));
// 7. Get Shared Brain Route/Endpoint of other users:
app.get("/api/v1/brain/:sharelink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.sharelink; // Get the share link from the URL parameters
    // Find the link in the database using the hash
    const link = yield db_1.LinkModel.findOne({ hash: hash });
    if (!link) {
        res.status(411).json({ message: "Sorry Incorrect Input" });
        return;
    }
    //Find the content of the user who shared their brain
    const content = yield db_1.ContentModel.find({ userId: link.userId });
    //Find the user who shared their brain 
    const user = yield db_1.UserModel.findOne({ _id: link.userId });
    if (!user) {
        res.status(411).json({
            message: "User not found,error should ideally not happen"
        });
        return;
    }
    // Return the content and user details
    res.json({
        username: user === null || user === void 0 ? void 0 : user.username, // Optional chaining to avoid errors if user is not found
        content: content
    });
}));
app.listen(4000);
