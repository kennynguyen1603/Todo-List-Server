import { Router } from "express";
import usersController from "../controllers/usersController.js";
import authMiddleware from "../middlewares/auth/auth.js";

const UserRouter = Router();

// Lấy toàn bộ users
UserRouter.get("", usersController.getAllUser);

UserRouter.get(
  "/search",
  authMiddleware.verifyToken,
  usersController.searchUsersByEmail
);

UserRouter.get(
  "/:userId",
  authMiddleware.verifyToken,
  usersController.getUserById
);

UserRouter.put("/:userId", async (req, res) => {
  // Implementation goes here
});

UserRouter.delete("/:userId", async (req, res) => {
  // Implementation goes here
});

// lấy todo cá nhân và todo thuộc 1 team mà user này có tham gia
UserRouter.get(
  "/:userId/todos",
  authMiddleware.verifyToken,
  usersController.getTodosByUserId
);

// lấy team mà user này tham gia
UserRouter.get(
  "/:userId/teams",
  authMiddleware.verifyToken,
  usersController.getTeamsByUserId
);

// thêm team vào user
UserRouter.post(
  "/:userId/teams",
  authMiddleware.verifyToken,
  usersController.addTeamToUser
);

// xoa team khoi user
// UserRouter.delete(
//   "/:userId/teams/:teamId",
//   authMiddleware.verifyToken,
//   usersController.removeTeamFromUser
// );

export default UserRouter;
