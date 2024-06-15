import { Router } from "express";
import cors from "cors";
import UserRouter from "./usersRouter.js";
import AuthRouter from "./authsRouter.js";
import TodoRouter from "./TodoRouter.js";
import TeamRouter from "./teamRouter.js";
import TodoListRouter from "./todoListRouter.js";
const rootRouterV1 = Router();

rootRouterV1.use(
  cors({
    origin: ["http://localhost:5173", "https://anotherdomain.com"],
    optionsSuccessStatus: 200,
  })
);

rootRouterV1.get("", (req, res) => {
  res.send({
    message: "Hello",
  });
});

rootRouterV1.use("/users", UserRouter);
rootRouterV1.use("/auth", AuthRouter);
rootRouterV1.use("/todos", TodoRouter);
rootRouterV1.use("/teams", TeamRouter);
rootRouterV1.use("/todoList", TodoListRouter);

export default rootRouterV1;
