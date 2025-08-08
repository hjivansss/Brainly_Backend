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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables from .env
const JWT_PASSWORD = process.env.JWT_PASSWORD;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const middleware_1 = require("./middleware"); // Import the user middleware for authentication
const utils_1 = require("./utils"); // Import the random function from utils
const cors_1 = __importDefault(require("cors"));
// Import Zod for input validation(checking if the input has the correct format)
//const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app = (0, express_1.default)();
app.use(express_1.default.json()); //This middleware is used to parse JSON bodies in requests
app.use((0, cors_1.default)());
// 7. Get Shared Brain Route/Endpoint of other users:
app.get("/api/v1/brain/:sharelink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.sharelink; // Get the share link from the URL parameters
    // Find the link in the database using the hash
    const link = yield db_1.LinkModel.findOne({ hash: hash });
    if (!link) {
        res.status(404).json({ message: "Invalid share link" }); // Send error if not found.
        return;
    }
    // Checking the hash -console.log(hash);
    // Fetch content and user details for the shareable link from link table.
    const content = yield db_1.ContentModel.find({ userId: link.userId });
    const user = yield db_1.UserModel.findOne({ _id: link.userId });
    if (!user) {
        res.status(404).json({ message: "User not found" }); // Handle missing user case.
        return;
    }
    const sanitizedContent = content.map(({ title, link, type }) => ({
        title,
        link,
        type,
    }));
    //Checking the content sent - console.log(sanitizedContent)
    res.json({
        hash: hash,
        username: user.username,
        content: sanitizedContent
    }); // Send user and content details in response.
}));
//Zod validation schema
const signupSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, "Username must be at least 3 characters long"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
// 1. Signup Route/Endpoint:
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Validate input with Zod
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({
            message: "Invalid input",
            errors: parseResult.error.errors.map(e => e.message),
        });
    }
    else {
        const { username, password } = parseResult.data;
        // 2. Hash the password before saving
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        try {
            // 3. Save the user to the database
            yield db_1.UserModel.create({
                username: username,
                password: hashedPassword,
            });
            res.json({
                message: "User signed up successfully",
            });
        }
        catch (error) {
            // 4. Handle duplicate username error
            res.status(409).json({
                message: "Error signing up: Duplicate username",
            });
        }
    }
}));
//
const signinSchema = zod_1.z.object({
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(6),
});
// 2. Signin Route/Endpoint:
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Validate input using Zod
    const parseResult = signinSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({
            message: "Invalid input",
            errors: parseResult.error.errors.map((e) => e.message),
        });
    }
    else {
        const { username, password } = parseResult.data;
        // 2. Find user
        const existingUser = yield db_1.UserModel.findOne({ username });
        if (!existingUser) {
            res.status(403).json({ message: "Invalid username or password" });
        }
        else {
            // 3. Compare passwords
            const isPasswordValid = yield bcryptjs_1.default.compare(password, existingUser.password);
            if (!isPasswordValid) {
                res.status(403).json({ message: "Invalid username or password" });
            }
            // 4. Generate JWT token
            const token = jsonwebtoken_1.default.sign({ id: existingUser._id }, JWT_PASSWORD);
            res.json({ token });
        }
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
app.delete("/api/v1/content/:id", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contentId = req.params.id;
    const result = yield db_1.ContentModel.deleteOne({
        _id: contentId,
        userId: req.userId //Making sure that the content belongs to the user who is trying to delete it
    });
    console.log(contentId);
    if (result.deletedCount === 0) {
        return;
        res.status(403).json({
            message: "Not your content"
        });
    }
    res.status(200).json({ message: "Deleted" });
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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
