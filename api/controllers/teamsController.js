import TeamSModel from "../models/teamsModel.js";
import UsersModel from "../models/usersModel.js";

const teamsController = {
  getAllTeams: async (req, res) => {
    try {
      const allTeams = await TeamSModel.find()
        .populate("members")
        .populate("todos");
      res.status(200).send({
        data: allTeams,
        message: "Get all teams success",
        success: true,
      });
    } catch (error) {
      res.status(500).send({
        message: error.message,
        data: null,
        success: false,
      });
    }
  },
  getTeamById: async (req, res) => {
    try {
      const { teamId } = req.params;

      const team = await TeamSModel.findById(teamId)
        .populate("members")
        .populate("todo");
      if (!team) {
        return res.status(404).send({
          message: "Team not found.",
          data: null,
          success: false,
        });
      }

      res.send({
        data: team,
        message: "Team data retrieved successfully.",
        success: true,
      });
    } catch (error) {
      res.status(500).send({
        message: error.message,
        data: null,
        success: false,
      });
    }
  },
  getMembersByTeamId: async (req, res) => {
    try {
      const { teamId } = req.params;

      const team = await TeamSModel.findById(teamId).populate("members");
      if (!team) {
        return res.status(404).send({
          message: "Team not found.",
          data: null,
          success: false,
        });
      }

      res.send({
        data: team.members,
        message: "Team members retrieved successfully.",
        success: true,
      });
    } catch (error) {
      res.status(500).send({
        message: error.message,
        data: null,
        success: false,
      });
    }
  },
  createTeam: async (req, res) => {
    try {
      const { name, color, avatar, members, todo } = req.body;

      const creatorId = req.user.userId;

      const newTeam = new TeamSModel({
        name,
        color,
        avatar,
        members,
        todo,
        creatorId,
      });

      const savedTeam = await newTeam.save();

      res.send({
        data: savedTeam,
        message: "Team created successfully.",
        success: true,
      });
    } catch (error) {
      res.status(500).send({
        message: error.message,
        data: null,
        success: false,
      });
    }
  },

  updateTeamById: async (req, res) => {
    try {
      const { teamId } = req.params;
      const updates = req.body;
      const userId = req.user.userId;

      const { members } = updates;
      const team = await TeamSModel.findById(teamId);
      if (!team) {
        return res.status(404).send({ message: "Team not found" });
      }

      if (team.creatorId.toString() !== userId.toString()) {
        return res
          .status(403)
          .send({ message: "You do not have permission to update this team" });
      }

      const updatedTeam = await TeamSModel.findByIdAndUpdate(
        teamId,
        { $set: updates },
        { new: true }
      )
        .populate("members")
        .populate("todo");

      await UsersModel.updateMany(
        { _id: { $in: members } },
        { $addToSet: { teams: teamId } }
      );

      const usersToRemove = await UsersModel.find({
        _id: { $nin: members },
        teams: teamId,
      });
      for (const user of usersToRemove) {
        user.teams.pull(teamId);
        await user.save();
      }

      res.send({
        data: updatedTeam,
        message: "Team updated successfully.",
        success: true,
      });
    } catch (error) {
      res.status(500).send({
        message: error.message || "Failed to update team",
        data: null,
        success: false,
      });
    }
  },

  deleteTeamById: async (req, res) => {
    try {
      const { teamId } = req.params;
      const deletedTeam = await TeamSModel.findByIdAndDelete(teamId);
      if (!deletedTeam)
        return res.status(404).send({ message: "Team not found" });
      res.send({
        data: deletedTeam,
        message: "Team deleted successfully.",
        success: true,
      });
    } catch (error) {
      res.status(500).send({ message: "Failed to delete team", error });
    }
  },

  getTeamsHasParticipatedByUserId: async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await UsersModel.findById(userId).populate("teams");
      res.status(200).send({
        data: user.teams || [],
        message: "Get user teams successfully!",
        success: true,
      });
    } catch (error) {
      res.status(500).send({ message: "Failed to fetch teams", error: error });
    }
  },
  getTeamsCreatedByUserId: async (req, res) => {
    try {
      const userId = req.user.userId;
      const teams = await TeamSModel.find({ members: userId });
      res.status(200).send({
        data: teams,
        message: "Get user teams successfully!",
        success: true,
      });
    } catch (error) {
      res.status(500).send({ message: "Failed to fetch teams", error: error });
    }
  },
  removeTeamFromUsers: async (req, res) => {
    try {
      const { teamId } = req.params;
      const team = await TeamSModel.findById(teamId)
        .populate("members")
        .populate("todo");
      if (!team) {
        return res.status(404).send({ message: "Team not found" });
      }

      const userIds = team.members.map((member) => member._id);
      await UsersModel.updateMany(
        { _id: { $in: userIds } },
        { $pull: { teams: teamId } }
      );

      await TeamSModel.findByIdAndDelete(teamId);

      res.send({
        data: team,
        message: "Team removed from users successfully.",
        success: true,
      });
    } catch (error) {
      res
        .status(500)
        .send({ message: "Failed to remove team from users", error });
    }
  },
};

export default teamsController;
