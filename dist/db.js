"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkModel = exports.ContentModel = exports.UserModel = void 0;
//Schemas 
const mongoose_1 = __importStar(require("mongoose"));
mongoose_1.default.connect("mongodb+srv://hjivansingha1234:4px3fp531tHLsUQK@cluster0.svhzdut.mongodb.net/Brainly");
// Defining the schema for the user
const userSchema = new mongoose_1.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});
// Creating the model for the user,Asigning the name 'User' to the model and exporting it
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
// Defining the schema for the Content
const contentSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    link: { type: String },
    type: String,
    tags: [{ type: mongoose_1.default.Types.ObjectId, ref: 'Tag' }], //Its an array of ObjectIds that takes reference from the Tag model
    userId: { type: mongoose_1.default.Types.ObjectId, ref: 'User', required: true }, //Its an ObjectId that takes reference from the User model
});
// Creating the model for the Content,Asigning the name 'Content' to the model and exporting it
exports.ContentModel = (0, mongoose_1.model)("Content", contentSchema);
// Defining the schema for the Tag
//Defining the schema for the link
const linkSchema = new mongoose_1.Schema({
    hash: String,
    userId: { type: mongoose_1.default.Types.ObjectId, ref: 'User', required: true, unique: true },
});
// Creating the model for the link,Asigning the name 'Link' to the model and exporting it
exports.LinkModel = (0, mongoose_1.model)("Link", linkSchema);
