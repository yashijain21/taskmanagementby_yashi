import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/error.middleware.js";

const taskStatusSchema = z.enum(["PENDING", "COMPLETED"]);

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional()
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    status: taskStatusSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

const listTaskSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: taskStatusSchema.optional(),
  search: z.string().trim().optional()
});

const idParamSchema = z.object({
  id: z.string().min(1)
});

const getUserId = (req: Request): string => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  return req.user.id;
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { title, description } = createTaskSchema.parse(req.body);

  const task = await prisma.task.create({
    data: {
      title,
      description,
      userId
    }
  });

  res.status(201).json(task);
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { page, pageSize, status, search } = listTaskSchema.parse(req.query);

  const where = {
    userId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          title: {
            contains: search
          }
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.task.count({ where })
  ]);

  res.json({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { id } = idParamSchema.parse(req.params);

  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  res.json(task);
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { id } = idParamSchema.parse(req.params);
  const data = updateTaskSchema.parse(req.body);

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new AppError("Task not found", 404);
  }

  const task = await prisma.task.update({
    where: { id },
    data
  });

  res.json(task);
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { id } = idParamSchema.parse(req.params);

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new AppError("Task not found", 404);
  }

  await prisma.task.delete({ where: { id } });
  res.status(204).send();
};

export const toggleTask = async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  const { id } = idParamSchema.parse(req.params);

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new AppError("Task not found", 404);
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      status: existing.status === "PENDING" ? "COMPLETED" : "PENDING"
    }
  });

  res.json(task);
};
