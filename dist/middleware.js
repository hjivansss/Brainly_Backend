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
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config"); // Import the JWT secret from config
// Middleware to authenticate user based on JWT token
const userMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the token from the Authorization header
    const header = req.headers["authorization"]; //Extract the "authorzation" header from the request headers
    if (!header) {
        return;
        res.status(401).json({ message: "JWT must be provided" });
    }
    // Verify the JWT token using the JWT_PASSWORD secret key.
    const decoded = jsonwebtoken_1.default.verify(header, config_1.JWT_PASSWORD);
    if (decoded) {
        //@ts-ignore            //Todo:override the type of the global request object 
        req.userId = decoded.id; // If the token is valid, set the userId in the request object4
        next(); // Call the next middleware or route handler
    }
    else {
        res.status(401).json({ message: "Unauthorized User" });
    }
});
exports.userMiddleware = userMiddleware;
