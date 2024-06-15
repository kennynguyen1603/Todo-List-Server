import TodosModel from "../models/todosModel.js";
import UsersModel from "../models/usersModel.js";
import TeamSModel from "../models/teamsModel.js";
// const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });

// app.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
//   // Giả sử bạn đã tải hình ảnh lên dịch vụ lưu trữ và nhận được URL
//   const avatarUrl = 'URL đến hình ảnh avatar';

//   // Cập nhật người dùng với URL mới
//   await User.findByIdAndUpdate(req.user.id, { avatarUrl: avatarUrl });

//   res.send({ message: 'Avatar updated successfully', avatarUrl: avatarUrl });
// });

const getTeamsByUserId = async (userId) => {
  try {
    const user = await UsersModel.findById(userId).populate("teams");
    return user.teams.map((team) => team._id);
  } catch (error) {
    console.error("Failed to fetch user's teams:", error);
    return [];
  }
};

const usersController = {
  getAllUser: async (req, res) => {
    const allUsers = await UsersModel.find();
    res.status(200).send({
      data: allUsers,
      message: "Get all user success",
      success: true,
    });
  },

  searchUsersByEmail: async (req, res) => {
    try {
      const { email } = req.query;
      if (!email || email.length < 7) {
        return res.status(400).send({
          message:
            "Email query parameter is required and should be at least 7 characters long.",
        });
      }
      const users = await UsersModel.find({ email: new RegExp(email, "i") });
      res.status(200).send({
        data: users,
        message: "Search user by email successfully",
        success: true,
      });
    } catch (error) {
      res.status(500).send({
        message: "Failed to search user by email",
        error: error,
      });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await UsersModel.findById(userId);
      if (!user) {
        return res.status(404).send({
          message: "User not found.",
          data: null,
          success: false,
        });
      }

      res.send({
        data: user,
        message: "User data retrieved successfully.",
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
  // lấy todo cá nhân và todo thuộc 1 team có tham gia
  getTodosByUserId: async (req, res) => {
    try {
      const userId = req.params.userId;
      const userTeams = await getTeamsByUserId(userId);
      const userTasks = await TodosModel.find({
        $or: [{ creatorId: userId }, { team_id: { $in: userTeams } }],
      }).populate("creatorId team_id");
      res.status(200).send({
        data: userTasks,
        message: "Get user tasks successfully!",
        success: true,
      });
    } catch (error) {
      res.status(500).send({ message: "Failed to fetch tasks", error: error });
    }
  },
  getTeamsByUserId: async (req, res) => {
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
  addTeamToUser: async (req, res) => {
    try {
      const userId = req.params.userId;
      const { teamId } = req.body;

      const user = await UsersModel.findById(userId);
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      const team = await TeamSModel.findById(teamId);
      if (!team) {
        return res.status(404).send({ message: "Team not found" });
      }

      user.teams.push(teamId);
      await user.save();

      res.status(200).send({
        data: user,
        message: "Team added to user successfully!",
        success: true,
      });
    } catch (error) {
      res.status(500).send({
        message: "Failed to add team to user",
        error: error,
      });
    }
  },
  // removeTeamFromUser: async (req, res) => {
  //   try {
  //     const userId = req.params.userId;
  //     const { teamId } = req.params;

  //     const user = await UsersModel.findById(userId);
  //     if (!user) {
  //       return res.status(404).send({ message: "User not found" });
  //     }

  //     const teamIndex = user.teams.indexOf(teamId);
  //     if (teamIndex === -1) {
  //       return res.status(404).send({ message: "Team not found" });
  //     }

  //     user.teams.splice(teamIndex, 1);
  //     await user.save();

  //     res.status(200).send({
  //       data: user,
  //       message: "Team removed from user successfully!",
  //       success: true,
  //     });
  //   } catch (error) {
  //     res.status(500).send({
  //       message: "Failed to remove team from user",
  //       error: error,
  //     });
  //   }
  // },
};

export default usersController;
