import mongoose from "mongoose";
import Collection from "../database/collection.js";

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: Collection.USERS,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
  type: {
    type: String,
    required: true,
    enum: ["refreshToken", "resetPasswordToken", "accessToken"], // Dạng token
  },
});

const TokensModel = mongoose.model(Collection.TOKENS, tokenSchema);
export default TokensModel;
