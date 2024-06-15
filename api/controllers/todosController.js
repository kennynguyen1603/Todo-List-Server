import TodosModel from "../models/todosModel.js";
import UsersModel from "../models/usersModel.js";
import TeamSModel from "../models/teamsModel.js";
import { validationResult } from "express-validator";
import TodoListsModel from "../models/todoListsModel.js";
const buildSearchQuery = (search, user, teamIds) => {
  const query = {
    $and: [],
  };

  if (search) {
    query.$and.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    });
  }

  query.$and.push({
    $or: [{ creatorId: user.userId }, { team_id: { $in: teamIds } }],
  });

  return query.$and.length > 0 ? query : {};
};

const removeTeamFromUsers = async (teamId) => {
  try {
    const result = await UsersModel.updateMany(
      { teams: teamId },
      { $pull: { teams: teamId } }
    );
    console.log(`Successfully removed team ${teamId} from all users.`);
  } catch (error) {
    console.error(`Failed to remove team ${teamId} from users:`, error);
  }
};

const addTeamToUsers = async (teamId, members) => {
  try {
    const memberIds = members.map((member) => member._id);
    await UsersModel.updateMany(
      { _id: { $in: memberIds } },
      { $addToSet: { teams: teamId } }
    );
    console.log(`Successfully added team ${teamId} to members.`);
  } catch (error) {
    console.error(`Failed to add team ${teamId} to members:`, error);
  }
};

const updateTaskLists = async (oldTaskListIds, newTaskListIds, todoId) => {
  try {
    // Xóa todo khỏi các task list cũ
    await TodoListsModel.updateMany(
      { _id: { $in: oldTaskListIds } },
      { $pull: { todolist: todoId } }
    );

    // Thêm todo vào các task list mới
    if (newTaskListIds && newTaskListIds.length > 0) {
      await TodoListsModel.updateMany(
        { _id: { $in: newTaskListIds } },
        { $addToSet: { todolist: todoId } }
      );
    }

    console.log(
      `Successfully updated task lists from ${oldTaskListIds} to ${newTaskListIds}.`
    );
  } catch (error) {
    console.error(`Failed to update task lists:`, error);
  }
};

const todosController = {
  getTodos: async (req, res) => {
    try {
      const { search, status, priority, dueDate } = req.query;
      const teamIds = req.user.teamIds;
      const user = req.user;

      const query = buildSearchQuery(search, user, teamIds);

      if (status) {
        query.$and.push({ status });
      }

      if (priority) {
        query.$and.push({ priority });
      }

      if (dueDate) {
        const start = new Date(dueDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);

        query.$and.push({
          due_date: {
            $gte: start,
            $lt: end,
          },
        });
      }

      const todos = await TodosModel.find(query).sort({ due_date: 1 });

      res.status(200).send({
        data: todos,
        message: "Get todos successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  createTodo: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() });
      }

      const {
        title,
        description,
        due_date,
        priority,
        status,
        team_id,
        todolist,
        // assignTo,
      } = req.body;

      const { userId } = req.user;

      // if (assignTo) {
      //   if (!mongoose.Types.ObjectId.isValid(assignTo)) {
      //     return res.status(400).send({ message: "Invalid assignTo ID" });
      //   }

      //   const user = await UsersModel.findById(assignTo);
      //   // const team = await TeamSModel.findById(assignTo);

      //   if (!user && !team) {
      //     return res
      //       .status(404)
      //       .send({ message: "Assigned user or team not found" });
      //   }
      // }

      const newTodo = new TodosModel({
        title,
        description,
        status,
        due_date,
        priority,
        creatorId: userId,
        team_id,
        todolist,
        // assignTo,
      });

      const savedTodo = await newTodo.save();

      res.status(201).send({
        data: savedTodo,
        message: "Create todo successfully!",
        success: true,
      });
    } catch (error) {
      return res.status(error.status || 500).send({
        data: null,
        message: error.message || "Server error while creating the to-do",
        success: false,
      });
    }
  },
  getTodoById: async (req, res) => {
    res.status(200).send({
      data: req.existingTodo,
      message: "Get todo successfully",
      success: true,
    });
  },
  updateTodoById: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }
    try {
      const todoId = req.existingTodo._id;
      const updateDataTodo = req.body;

      delete updateDataTodo.creatorId;

      const existingTodo = await TodosModel.findById(todoId);

      if (
        updateDataTodo.team_id &&
        updateDataTodo.team_id !== existingTodo.team_id.toString()
      ) {
        await removeTeamFromUsers(existingTodo.team_id);
        await addTeamToUsers(updateDataTodo.team_id, updateDataTodo.members);
      }

      // Cập nhật task lists
      if (updateDataTodo.todolist) {
        const oldLists = existingTodo.todolist || [];
        const newLists = updateDataTodo.todolist || [];
        await updateTaskLists(oldLists, newLists, todoId);
      }

      const updatedTodo = await TodosModel.findByIdAndUpdate(
        todoId,
        updateDataTodo,
        { new: true, runValidators: true }
      );

      return res.status(200).send({
        data: updatedTodo,
        message: "Task updated successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  // deleteTodoById: async (req, res) => {
  //   try {
  //     const todoId = req.todoId;

  //     const todo = await TodosModel.findById(todoId).populate("team_id");
  //     if (!todo) {
  //       return res.status(404).send({ message: "Task not found" });
  //     }

  //     // xóa todo
  //     await TodosModel.findByIdAndDelete(todoId);

  //     // Xóa team liên quan
  //     if (todo.team_id) {
  //       const teamId = todo.team_id._id;

  //       // Xóa team khỏi user models
  //       await removeTeamFromUsers(teamId);

  //       // Xóa team
  //       await TeamSModel.findByIdAndDelete(teamId);
  //     }
  //     res.status(200).send({
  //       message: "Todo deleted successfully!",
  //       success: true,
  //     });
  //   } catch (error) {
  //     return res
  //       .status(500)
  //       .send({ message: error.message || "Internal server error" });
  //   }
  // },
  deleteTodoById: async (req, res) => {
    try {
      const todoId = req.params.todoId;
      const todo = await TodosModel.findById(todoId).populate("team_id");
      if (!todo) {
        return res.status(404).send({ message: "Task not found" });
      }

      await TodoListsModel.updateMany(
        { todolist: todoId },
        { $pull: { todolist: todoId } }
      );

      await TodosModel.findByIdAndDelete(todoId);

      if (todo.team_id) {
        const teamId = todo.team_id._id;

        await removeTeamFromUsers(teamId);

        await TeamSModel.findByIdAndDelete(teamId);
      }

      res.status(200).send({
        message: "Todo deleted successfully!",
        success: true,
      });
    } catch (error) {
      console.error("Error deleting todo: ", error);
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  getTodoMembers: async (req, res) => {
    try {
      const todoId = req.existingTodo._id;
      const todo = await TodosModel.findById(todoId).populate("team_id");
      if (!todo) {
        return res.status(404).send({ message: "Todo not found" });
      }
      res.status(200).send({
        message: "Get todo members successfully",
        data: todo,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  getTodosToday: async (req, res) => {
    try {
      const { search, status, priority, dueDate } = req.query;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let query = buildSearchQuery(search, req.user, req.user.teamIds);

      query.$and.push({
        due_date: { $gte: today, $lt: tomorrow },
      });

      if (status) {
        query.$and.push({ status });
      }

      if (priority) {
        query.$and.push({ priority });
      }

      if (dueDate) {
        const startDueDate = new Date(dueDate);
        startDueDate.setHours(0, 0, 0, 0);
        const endDueDate = new Date(startDueDate);
        endDueDate.setDate(startDueDate.getDate() + 1);

        query.$and.push({
          due_date: {
            $gte: startDueDate,
            $lt: endDueDate,
          },
        });
      }

      const todos = await TodosModel.find(query).sort({ due_date: 1 });

      res.status(200).send({
        data: todos,
        message: "Get todos today successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  getTodosRecently: async (req, res) => {
    try {
      const { search, status, priority, dueDate } = req.query;

      const user = req.user;
      const teamIds = user.teamIds;

      const end = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - 7);

      let query = buildSearchQuery(search, user, teamIds);

      query.$and.push({
        due_date: { $gte: start, $lt: end },
      });

      if (status) {
        query.$and.push({ status });
      }

      if (priority) {
        query.$and.push({ priority });
      }

      if (dueDate) {
        const startDueDate = new Date(dueDate);
        startDueDate.setHours(0, 0, 0, 0);
        const endDueDate = new Date(startDueDate);
        endDueDate.setDate(startDueDate.getDate() + 1);

        query.$and.push({
          due_date: {
            $gte: startDueDate,
            $lt: endDueDate,
          },
        });
      }

      const todos = await TodosModel.find(query).sort({ due_date: 1 });

      res.status(200).send({
        data: todos,
        message: "Get todos recently successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  getTodosUpcoming: async (req, res) => {
    try {
      const { search, status, priority, dueDate } = req.query;

      const user = req.user;
      const teamIds = user.teamIds;

      const start = new Date();
      const end = new Date(start);
      end.setDate(start.getDate() + 7); // Lấy các task trong 7 ngày tới

      let query = buildSearchQuery(search, user, teamIds);

      query.$and.push({
        due_date: { $gte: start, $lt: end },
      });

      if (status) {
        query.$and.push({ status });
      }

      if (priority) {
        query.$and.push({ priority });
      }

      if (dueDate) {
        const startDueDate = new Date(dueDate);
        startDueDate.setHours(0, 0, 0, 0);
        const endDueDate = new Date(startDueDate);
        endDueDate.setDate(startDueDate.getDate() + 1);

        query.$and.push({
          due_date: {
            $gte: startDueDate,
            $lt: endDueDate,
          },
        });
      }

      const todos = await TodosModel.find(query).sort({ due_date: 1 });

      res.status(200).send({
        data: todos,
        message: "Get todos upcoming successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  getTodosLater: async (req, res) => {
    try {
      const { search, status, priority, dueDate } = req.query;

      const user = req.user;
      const teamIds = user.teamIds;

      const start = new Date();
      start.setDate(start.getDate() + 7); // Lấy các task sau 7 ngày tới

      let query = buildSearchQuery(search, user, teamIds);

      query.$and.push({
        due_date: { $gte: start },
      });

      if (status) {
        query.$and.push({ status });
      }

      if (priority) {
        query.$and.push({ priority });
      }

      if (dueDate) {
        const startDueDate = new Date(dueDate);
        startDueDate.setHours(0, 0, 0, 0);
        const endDueDate = new Date(startDueDate);
        endDueDate.setDate(startDueDate.getDate() + 1);

        query.$and.push({
          due_date: {
            $gte: startDueDate,
            $lt: endDueDate,
          },
        });
      }

      const todos = await TodosModel.find(query).sort({ due_date: 1 });

      res.status(200).send({
        data: todos,
        message: "Get todos later successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  getTodosByDate: async (req, res) => {
    try {
      const { date } = req.query;

      if (!date) {
        return res
          .status(400)
          .send({ message: "Date is required", success: false, data: null });
      }

      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const todos = await TodosModel.find({
        $or: [
          { creatorId: req.user.userId },
          { team_id: { $in: req.user.teamIds } },
        ],
        due_date: { $gte: start, $lt: end },
      }).sort({ due_date: 1 });

      res.status(200).send({
        data: todos,
        message: "Get todos by date successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  updateProgress: async (req, res) => {
    try {
      const { processValue } = req.body;
      const todoId = req.existingTodo._id;
      const task = await TodosModel.findByIdAndUpdate(
        todoId,
        { processValue },
        { new: true }
      );
      res.status(200).send({
        data: task,
        message: "Progress updated successfully",
        success: true,
      });
    } catch (error) {
      return res
        .status(500)
        .send({ message: error.message || "Internal server error" });
    }
  },
  updateTimes: async (req, res) => {
    try {
      const { start_time, end_time } = req.body;
      const { todoId } = req.params;

      const updates = {};
      if (start_time) updates.start_time = new Date(start_time);
      if (end_time) updates.end_time = new Date(end_time);

      const task = await TodosModel.findByIdAndUpdate(todoId, updates, {
        new: true,
      });

      if (!task) {
        return res.status(404).send({
          message: "Task not found",
          success: false,
        });
      }

      res.status(200).send({
        data: task,
        message: "Times updated successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).send({
        message: error.message || "Internal server error",
        success: false,
      });
    }
  },
};

export default todosController;
