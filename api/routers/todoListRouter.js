import { Router } from "express";
import todoListController from "../controllers/todoListController.js";
import { check, body } from "express-validator";
import authMiddleware from "../middlewares/auth/auth.js";

const TodoListRouter = Router();

TodoListRouter.get(
  "",
  authMiddleware.verifyAdmin,
  todoListController.getAllTaskList
);

TodoListRouter.post(
  "",
  authMiddleware.verifyToken,
  check("name").not().isEmpty().withMessage("Name is required!"),
  todoListController.createTaskList
);

TodoListRouter.get(
  "/user",
  authMiddleware.verifyToken,
  todoListController.getTaskListByUserId
);

// Lấy taskList theo id
TodoListRouter.get(
  "/:taskListId",
  authMiddleware.verifyToken,
  todoListController.getTaskListById
);

// Cập nhật taskList theo id
TodoListRouter.put(
  "/:taskListId",
  authMiddleware.verifyToken,
  todoListController.updateTaskList
);

// Xóa taskList theo id
TodoListRouter.delete(
  "/:taskListId",
  authMiddleware.verifyToken,
  todoListController.deleteTaskList
);

// Lấy task theo id của taskList
TodoListRouter.get(
  "/:taskListId/todos",
  authMiddleware.verifyToken,
  todoListController.getTasksByTaskListId
);

// Thêm task vào taskList
// TodoListRouter.post(
//   "/:taskListId/todos",
//   authMiddleware.verifyToken,
//   body("title").not().isEmpty().withMessage("Title is required!"),
//   todoListController.createTask
// );

// xoa task khoi taskList
TodoListRouter.delete(
  "/:taskListId/todos/:taskId",
  authMiddleware.verifyToken,
  todoListController.deleteTask
);

export default TodoListRouter;
