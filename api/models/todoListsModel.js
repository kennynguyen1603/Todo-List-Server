import mongoose from "mongoose";
import Collection from "../database/collection.js";

const todoListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    avatar: { type: String, default: "" },
    color: { type: String, default: "#FFFFFF" },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Collection.USERS,
      required: true,
    },
    owner: [{ type: mongoose.Schema.Types.ObjectId, ref: Collection.USERS }],
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: null,
    },
    due_date: { type: Date, required: false },
    processValue: { type: Number, default: 0 },
    todolist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Collection.TODOlISTS,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const TodoListsModel = mongoose.model(Collection.TODOlISTS, todoListSchema);
export default TodoListsModel;
