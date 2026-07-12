// modules/tasks/task.controller.js
"use strict";

const taskRepo = require("../../repositories/task.repository");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");

exports.createTask = async (req, res, next) => {
    try {
        const { title, category } = req.body;
        const today = new Date().toISOString().split("T")[0];
        await taskRepo.addTask(req.user.id, title.trim(), category, today);
        res.status(201).json(formatSuccess(null, "Task added."));
    } catch (err) { next(err); }
};

exports.getTasks = async (req, res, next) => {
    try {
        const date  = req.query.date || new Date().toISOString().split("T")[0];
        const tasks = await taskRepo.getTasksByDate(req.user.id, date);
        res.status(200).json(formatSuccess(tasks));
    } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
    try {
        const task = await taskRepo.getTaskById(req.params.id);
        if (!task)
            return res.status(404).json(formatError("Task not found."));
        if (task.user_id !== req.user.id)
            return res.status(403).json(formatError("Forbidden: you do not own this task."));

        const result = await taskRepo.updateTaskStatus(req.params.id, req.user.id, req.body.status);
        if (result.changes === 0)
            return res.status(404).json(formatError("Task not found."));
        res.status(200).json(formatSuccess(null, "Task updated."));
    } catch (err) { next(err); }
};

exports.editTaskTitle = async (req, res, next) => {
    try {
        const task = await taskRepo.getTaskById(req.params.id);
        if (!task)
            return res.status(404).json(formatError("Task not found."));
        if (task.user_id !== req.user.id)
            return res.status(403).json(formatError("Forbidden: you do not own this task."));

        const result = await taskRepo.updateTaskTitle(req.params.id, req.user.id, req.body.title.trim());
        if (result.changes === 0)
            return res.status(404).json(formatError("Task not found."));
        res.status(200).json(formatSuccess(null, "Task title updated."));
    } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
    try {
        const task = await taskRepo.getTaskById(req.params.id);
        if (!task)
            return res.status(404).json(formatError("Task not found."));
        if (task.user_id !== req.user.id)
            return res.status(403).json(formatError("Forbidden: you do not own this task."));

        const result = await taskRepo.deleteTask(req.params.id, req.user.id);
        if (result.changes === 0)
            return res.status(404).json(formatError("Task not found."));
        res.status(200).json(formatSuccess(null, "Task deleted."));
    } catch (err) { next(err); }
};

exports.getStreak = async (req, res, next) => {
    try {
        const dates = await taskRepo.getStreakDates(req.user.id);

        if (dates.length === 0)
            return res.status(200).json(formatSuccess({ streak: 0 }));

        const today      = new Date().toISOString().split("T")[0];
        const yesterday  = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
        const mostRecent = dates[0].log_date;

        if (mostRecent !== today && mostRecent !== yesterday)
            return res.status(200).json(formatSuccess({ streak: 0 }));

        let streak       = 1;
        let expectedDate = mostRecent === today ? yesterday : mostRecent;

        for (let i = 1; i < dates.length; i++) {
            if (dates[i].log_date === expectedDate) {
                streak++;
                const d = new Date(expectedDate + "T00:00:00");
                d.setDate(d.getDate() - 1);
                expectedDate = d.toISOString().split("T")[0];
            } else {
                break;
            }
        }

        res.status(200).json(formatSuccess({ streak }));
    } catch (err) { next(err); }
};