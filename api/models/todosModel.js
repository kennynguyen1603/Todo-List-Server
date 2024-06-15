import mongoose from "mongoose";
import Collection from "../database/collection.js";

const todoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
    start_date: { type: Date, required: false },
    due_date: { type: Date, required: false },
    start_time: { type: Date, required: false },
    end_time: { type: Date, required: false },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Collection.USERS,
    },
    team_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Collection.TEAM,
      required: false,
    },
    processValue: { type: Number, default: 0 },

    todolist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: Collection.TODOlISTS,
      },
    ],
    assignTo: {
      type: mongoose.Schema.Types.Mixed, // Mixed to allow both users and teams
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const TodosModel = mongoose.model(Collection.TODOS, todoSchema);
export default TodosModel;
