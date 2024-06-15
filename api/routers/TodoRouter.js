import { Router } from "express";
import authMiddleware from "../middlewares/auth/auth.js";
import todosController from "../controllers/todosController.js";
import { check, body } from "express-validator";

const TodoRouter = Router();

// tạo todo mới
TodoRouter.post(
  "",
  authMiddleware.verifyToken,
  [
    check("title").not().isEmpty().withMessage("Title is required"),
    // check("description").not().isEmpty().withMessage("Description is required"),
    // check("createdBy").not().isEmpty().withMessage("Creator ID is required"),
    // check("teamId").not().isEmpty().withMessage("Team ID is required"),
    // check("status")
    //   .isIn(["Pending", "In Progress", "Completed"])
    //   .withMessage("Invalid status"),
    // check("priority")
    //   .isIn(["Low", "Medium", "High"])
    //   .withMessage("Invalid priority"),

    // check date
    check("dueDate").custom((value) => {
      if (value < new Date()) {
        throw new Error("Due date must be in the future");
      }
      return true;
    }),
  ],
  todosController.createTodo
);
// Lấy todo có điều kiện (search, status, priority, dueDate)
TodoRouter.get("/search", authMiddleware.verifyToken, todosController.getTodos);

// Lấy tasks ngày hôm nay
TodoRouter.get(
  "/today",
  authMiddleware.verifyToken,
  todosController.getTodosToday
);

// Lấy tasks recently
TodoRouter.get(
  "/recently",
  authMiddleware.verifyToken,
  todosController.getTodosRecently
);

// Lấy tasks upcoming
TodoRouter.get(
  "/upcoming",
  authMiddleware.verifyToken,
  todosController.getTodosUpcoming
);

// Lấy tasks later
TodoRouter.get(
  "/later",
  authMiddleware.verifyToken,
  todosController.getTodosLater
);

// Lấy tasks theo ngày được chọn
TodoRouter.get(
  "/by-date",
  authMiddleware.verifyToken,
  todosController.getTodosByDate
);

// lấy todo
// những người chung 1 team cũng có thể xem
TodoRouter.get(
  "/:todoId",
  authMiddleware.verifyToken,
  authMiddleware.authorizeTodoAccess,
  todosController.getTodoById
);

// sửa todo
// Những người trong team có thể sửa nếu cần
TodoRouter.put(
  "/:todoId",
  authMiddleware.verifyToken,
  authMiddleware.authorizeTodoAccess,
  [
    body("title")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Title must not be empty"),
    body("description").optional().isString(),
    body("status").optional().isIn(["Not Started", "In Progress", "Completed"]),
    body("priority").optional().isIn(["Low", "Medium", "High", "Urgent"]),
    body("due_date").optional().isISO8601().toDate(),
    body("team_id").optional().isMongoId(),
    body("todolist").optional().isMongoId(),
  ],
  todosController.updateTodoById
);

// xóa todo
TodoRouter.delete(
  "/:todoId",
  authMiddleware.verifyToken,
  authMiddleware.verifyOwnership,
  todosController.deleteTodoById
);

// Lấy thành viên dựa vào todoId
TodoRouter.get(
  "/:todoId/members",
  authMiddleware.verifyToken,
  authMiddleware.authorizeTodoAccess,
  todosController.getTodoMembers
);

TodoRouter.put(
  "/:todoId/update-progress",
  authMiddleware.verifyToken,
  [
    check("processValue")
      .isInt({ min: 0, max: 100 })
      .withMessage("Progress value must be an integer between 0 and 100"),
  ],
  authMiddleware.authorizeTodoAccess,
  todosController.updateProgress
);
// update times
TodoRouter.put(
  "/:todoId/update-times",
  authMiddleware.verifyToken,
  [
    check("start_time")
      .optional()
      .isISO8601()
      .withMessage("Invalid start time format"),
    check("end_time")
      .optional()
      .isISO8601()
      .withMessage("Invalid end time format"),
  ],
  authMiddleware.authorizeTodoAccess,
  todosController.updateTimes
);

export default TodoRouter;
