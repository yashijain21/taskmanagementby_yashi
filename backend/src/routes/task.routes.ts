import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  toggleTask,
  updateTask
} from "../controllers/task.controller.js";
import { authGuard } from "../middleware/auth.middleware.js";

export const taskRouter = Router();

taskRouter.use(authGuard);
taskRouter.get("/", getTasks);
taskRouter.post("/", createTask);
taskRouter.get("/:id", getTaskById);
taskRouter.patch("/:id", updateTask);
taskRouter.delete("/:id", deleteTask);
taskRouter.patch("/:id/toggle", toggleTask);
