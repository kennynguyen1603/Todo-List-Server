import mongoose from "mongoose";
import Collection from "../database/collection.js";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  avatarUrl: { type: String, default: "" },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  career: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: Collection.TEAM }],
  role: {
    type: String,
    enum: ["ADMIN", "USER"],
    default: "USER",
  },
  // personalList: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: Collection.TODOlISTS,
  // },
});

// Adding index for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

const UsersModel = mongoose.model(Collection.USERS, userSchema);
export default UsersModel;
