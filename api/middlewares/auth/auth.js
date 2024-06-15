// import UsersModel from "../models/users.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import UsersModel from "../../models/usersModel.js";
import TodosModel from "../../models/todosModel.js";
dotenv.config();
const authMiddleware = {
  verifyToken: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .send({ message: "Unauthorized! No token provided." });
    }
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send({ message: "No token provided." });
    }

    jwt.verify(
      token,
      process.env.MY_ACCESS_SECRET_KEY,
      async (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized!" });
        }
        const user = await UsersModel.findById(
          decoded.userData.userId
        ).populate("teams");
        req.user = {
          userId: user._id,
          teamIds: user.teams.map((team) => team._id),
        };
        next();
      }
    );
  },
  verifyOwnership: async (req, res, next) => {
    try {
      const { todoId } = req.params;

      if (!todoId)
        return res.status(401).send({ message: "TodoId is required" });

      const existingTodo = await TodosModel.findById({ _id: todoId });

      // sau khi login thi thong tin nguoi dung se duoc luu o session

      const user = await UsersModel.findById(req.user.userId);

      if (!existingTodo) throw new Error("Todo does not exist!");

      req.existingTodo = existingTodo;

      if (
        user._id.toString() === existingTodo.creatorId.toString() ||
        user.role === "ADMIN"
      ) {
        req.todoId = todoId;
        next();
      } else {
        return res.status(403).send({
          message: "You do not have permission to modify this todo",
        });
      }
    } catch (error) {
      return res.status(error.status || 500).send({
        data: null,
        message: error.message || "Internal server error",
        success: false,
      });
    }
  },
  // authorizeTodoAccess: người sở hữu hoặc chung 1 team mới có thể xem todo
  authorizeTodoAccess: async (req, res, next) => {
    try {
      const { todoId } = req.params;
      if (!todoId)
        return res.status(401).send({ message: "TodoId is required" });

      const existingTodo = await TodosModel.findById({ _id: todoId })
        .populate("creatorId")
        .populate("team_id");

      if (!existingTodo) throw new Error("Todo does not exist!");

      const isAuthorized =
        existingTodo.creatorId._id.equals(req.user.userId) ||
        existingTodo.team_id.members.some((teamMember) =>
          teamMember.equals(req.user.userId)
        );

      if (!isAuthorized) return res.status(403).send({ message: "Forbidden" });

      // trả ra dữ liệu todo từ id
      req.existingTodo = existingTodo;

      next();
    } catch (error) {
      return res.status(error.status || 500).send({
        data: null,
        message: error.message || "Internal server error",
        success: false,
      });
    }
  },
  verifyAdmin: async (req, res, next) => {
    try {
      // sau khi đăng nhập
      const user = await UsersModel.findById(req.user.userId);

      if (!user) throw new Error("User not found!");

      if (user.role !== "ADMIN")
        return res.status(403).send({ message: "Forbidden" });

      next();
    } catch (error) {
      return res.status(error.status || 500).send({
        data: null,
        message: error.message || "Internal server error",
        success: false,
      });
    }
  },
};

export default authMiddleware;
