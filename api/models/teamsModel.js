import mongoose from "mongoose";
import Collection from "../database/collection.js";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, required: false },
    avatar: { type: String, required: false },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: Collection.USERS }],
    todo: [{ type: mongoose.Schema.Types.ObjectId, ref: Collection.TODOS }],
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Collection.USERS,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// teamSchema.index({ members: 1 });

const TeamSModel = mongoose.model(Collection.TEAM, teamSchema);
export default TeamSModel;
