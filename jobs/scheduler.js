const cron = require("node-cron");
const reminderService = require("../services/reminder.service");
const weeklyTipService = require("../services/weeklyTip.service");

// NOTE: Ensure DB index on Reminder(completed, date, lastSentAt) for performance
const start = () => {
  // Every minute: turn due reminders into notifications
  cron.schedule("* * * * *", async () => {
    try {
      const fired = await reminderService.fireDueReminders();
      if (fired) console.log(`Scheduler: sent ${fired} reminder notification(s)`);
    } catch (err) {
      console.error("Scheduler (fire) error:", err.message);
    }
  });

  // Every hour: refresh automatic reminders (period due, appointments, medications)
  cron.schedule("0 * * * *", async () => {
    try {
      await reminderService.syncAutomaticReminders();
    } catch (err) {
      console.error("Scheduler (sync) error:", err.message);
    }
  });

  // Mondays at 09:00: feature a new health tip and tell everyone who wants them
  cron.schedule("0 9 * * 1", async () => {
    try {
      await weeklyTipService.rotateWeeklyTip();
    } catch (err) {
      console.error("Scheduler (weekly tip) error:", err.message);
    }
  });

  console.log("Scheduler started");
};

module.exports = { start };