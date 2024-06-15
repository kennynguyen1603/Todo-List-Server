import TodoListsModel from "../models/todoListsModel.js";
import { validationResult } from "express-validator";
import TodosModel from "../models/todosModel.js";
const todoListController = {
  getAllTaskList: async (req, res) => {
    try {
      const taskList = await TodoListsModel.find();
      res.status(200).send({
        message: "Get all task list successfully",
        data: taskList,
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },

  createTaskList: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
      }
      const { name } = req.body;
      const taskListExist = await TodoListsModel.findOne({
        name: name,
      });
      if (taskListExist) {
        return res.status(400).send({
          message: "Task list already exists",
          success: false,
        });
      }

      const { userId } = req.user;

      const taskList = new TodoListsModel({
        name: name,
        creatorId: userId,
      });
      await taskList.save();
      res.status(201).send({
        message: "Create task list successfully",
        data: taskList,
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },

  getTaskListByUserId: async (req, res) => {
    try {
      const taskList = await TodoListsModel.find({
        creatorId: req.user.userId,
      });
      res.status(200).send({
        message: "Get task list by user successfully",
        data: taskList,
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },

  // kiem tra id co ton tai hay khong
  getTaskListById: async (req, res) => {
    try {
      const taskListExist = await TodoListsModel.findById(
        req.params.taskListId
      );
      if (!taskListExist) {
        return res.status(404).send({
          message: "Task list not found",
          success: false,
        });
      }

      res.status(200).send({
        message: "Get task list by id successfully",
        data: taskListExist,
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },

  updateTaskList: async (req, res) => {
    try {
      const updatedTodoList = await TodoListsModel.findByIdAndUpdate(
        req.params.taskListId,
        req.body
      );
      res.status(200).send({
        data: updatedTodoList,
        message: "Update task list successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },

  deleteTaskList: async (req, res) => {
    try {
      await TodoListsModel.findByIdAndDelete(req.params.taskListId);
      res.status(200).send({
        message: "Delete task list successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  getTasksByTaskListId: async (req, res) => {
    try {
      const taskListId = req.params.taskListId;
      const taskList = await TodoListsModel.findById(taskListId).populate(
        "creatorId",
        "username email"
      );
      // .populate("assignTo", "username email");
      if (!taskList) {
        return res.status(404).send({
          message: "Task list not found.",
          data: null,
          success: false,
        });
      }
      res.send({
        data: taskList,
        message: "Tasks retrieved successfully.",
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
  deleteTask: async (req, res) => {
    try {
      const taskListId = req.params.taskListId;
      const taskId = req.params.taskId;

      // Xóa taskId khỏi todolist của taskListId
      const updatedTaskList = await TodoListsModel.findByIdAndUpdate(
        taskListId,
        {
          $pull: { todolist: taskId },
        },
        { new: true }
      );

      if (!updatedTaskList) {
        return res.status(404).send({
          message: "Task list not found.",
          data: null,
          success: false,
        });
      }

      await TodosModel.findByIdAndUpdate(taskId, {
        $pull: { todolist: taskListId },
      });

      res.send({
        message: "Task removed from list successfully.",
        success: true,
      });
    } catch (error) {
      res.status(500).send({
        message: error.message,
        success: false,
      });
    }
  },
};
export default todoListController;
