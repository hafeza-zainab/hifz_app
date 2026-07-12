import { authFetch } from '../../../shared/services/http';

export const schedulerApi = {
  // Events
  async getEvents() {
    const res = await authFetch('/scheduler/events', {}, 'getEvents');
    return res?.events || [];
  },

  async createEvent(event) {
    const res = await authFetch('/scheduler/events', {
      method: 'POST',
      body: JSON.stringify(event),
    }, 'createEvent');
    return res?.event || res?.data;
  },

  async updateEvent(id, event) {
    const res = await authFetch(`/scheduler/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    }, 'updateEvent');
    return res?.event || res?.data;
  },

  async deleteEvent(id) {
    const res = await authFetch(`/scheduler/events/${id}`, {
      method: 'DELETE',
    }, 'deleteEvent');
    return res;
  },

  async copyEvent(eventId, targetDays) {
    const res = await authFetch('/scheduler/events/copy', {
      method: 'POST',
      body: JSON.stringify({ eventId, targetDays }),
    }, 'copyEvent');
    return res?.data;
  },

  // Revision Units
  async getRevisionUnits(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await authFetch(`/scheduler/revision-units?${params}`, {}, 'getRevisionUnits');
    return res?.data || [];
  },

  async generateRevisionUnits(data) {
    const res = await authFetch('/scheduler/revision-units/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'generateRevisionUnits');
    return res?.data || [];
  },

  // Schedule
  async generateSchedule(data) {
    const res = await authFetch('/scheduler/schedule/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }, 'generateSchedule');
    return res?.data;
  },

  async getSchedule(weekId) {
    const res = await authFetch(`/scheduler/schedule/${weekId}`, {}, 'getSchedule');
    return res?.data;
  },

  async getCurrentSchedule() {
    const res = await authFetch('/scheduler/schedule/current', {}, 'getCurrentSchedule');
    return res?.data;
  },

  async adjustSchedule(weekId, schedule) {
    const res = await authFetch(`/scheduler/schedule/${weekId}`, {
      method: 'PUT',
      body: JSON.stringify({ schedule }),
    }, 'adjustSchedule');
    return res?.data;
  },

  async validateSchedule(schedule) {
    const res = await authFetch('/scheduler/schedule/validate', {
      method: 'POST',
      body: JSON.stringify({ schedule }),
    }, 'validateSchedule');
    return res?.data;
  },

  // Templates
  async getTemplates() {
    const res = await authFetch('/scheduler/templates', {}, 'getTemplates');
    return res;
  },

  async createTemplate(name, events) {
    const res = await authFetch('/scheduler/templates', {
      method: 'POST',
      body: JSON.stringify({ name, events }),
    }, 'createTemplate');
    return res;
  },

  async deleteTemplate(id) {
    const res = await authFetch(`/scheduler/templates/${id}`, {
      method: 'DELETE',
    }, 'deleteTemplate');
    return res;
  },

  async applyTemplate(events, days, board, gradeBand) {
    const body = { events, days };
    if (board) body.board = board;
    if (gradeBand) body.gradeBand = gradeBand;
    
    const res = await authFetch('/scheduler/templates/apply', {
      method: 'POST',
      body: JSON.stringify(body),
    }, 'applyTemplate');
    return res;
  },

  async getSchoolBoards() {
    const res = await authFetch('/scheduler/templates/school-boards', {}, 'getSchoolBoards');
    return res;
  },
};
