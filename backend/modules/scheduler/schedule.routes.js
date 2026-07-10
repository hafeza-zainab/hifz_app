const express = require('express');
const router = express.Router();
const scheduleController = require('./schedule.controller');
const eventController = require('./event.controller');
const templateController = require('./template.controller');
const auth = require('../../middleware/authMiddleware');

// Schedule routes
router.post('/schedule/generate', auth, scheduleController.generateWeeklySchedule.bind(scheduleController));
router.get('/schedule/:weekId', auth, scheduleController.getSchedule.bind(scheduleController));
router.get('/schedule/current', auth, scheduleController.getCurrentSchedule.bind(scheduleController));
router.put('/schedule/:weekId', auth, scheduleController.adjustSchedule.bind(scheduleController));
router.post('/schedule/validate', auth, scheduleController.validateSchedule.bind(scheduleController));

// Revision units routes
router.get('/revision-units', auth, scheduleController.getRevisionUnits.bind(scheduleController));
router.post('/revision-units/generate', auth, scheduleController.generateRevisionUnits.bind(scheduleController));

// Event routes
router.post('/events', auth, eventController.create.bind(eventController));
router.get('/events', auth, eventController.getByUserId.bind(eventController));
router.get('/events/:id', auth, eventController.getById.bind(eventController));
router.put('/events/:id', auth, eventController.update.bind(eventController));
router.delete('/events/:id', auth, eventController.delete.bind(eventController));
router.post('/events/copy', auth, eventController.copy.bind(eventController));
router.post('/events/bulk', auth, eventController.bulkCreate.bind(eventController));

// Template routes
router.get('/templates', auth, templateController.getAll.bind(templateController));
router.get('/templates/school-boards', auth, templateController.getSchoolBoards.bind(templateController));
router.post('/templates', auth, templateController.create.bind(templateController));
router.delete('/templates/:id', auth, templateController.delete.bind(templateController));
router.post('/templates/apply', auth, templateController.apply.bind(templateController));

module.exports = router;
