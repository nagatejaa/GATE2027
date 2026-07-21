function dailyCheckin() {
  const settings = SheetsDB.getSettings();
  const chatId = settings.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const msg = "Good evening! Time for your daily check-in.\nHow's your energy today?";
  const markup = {
    inline_keyboard: [
      [{ text: "High ⚡", callback_data: "energy_high" }, { text: "Medium 🔋", callback_data: "energy_medium" }],
      [{ text: "Low 🪫", callback_data: "energy_low" }, { text: "Exhausted 😴", callback_data: "energy_exhausted" }],
      [{ text: "Today is busy 🚫", callback_data: "energy_busy" }]
    ]
  };

  TelegramBot.sendMessage(chatId, msg, markup);
  
  // Log checkin initialized
  const dateStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
  SheetsDB.updateDailyLog(dateStr, { Status: 'pending', CheckinTime: new Date() });
}

function sendReminder() {
  const settings = SheetsDB.getSettings();
  const chatId = settings.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const dateStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
  const log = SheetsDB.getTodayLog(new Date());
  
  if (log && log.Status === 'pending' && !log.EnergyLevel) {
    TelegramBot.sendMessage(chatId, "Hey, just a gentle reminder for your check-in! Let me know how you're doing whenever you have a second.");
  }
}

function triggerWeeklyReplan() {
  Adaptor.runWeeklyReplan();
}

function noonCheckin() {
  const settings = SheetsDB.getSettings();
  const chatId = settings.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const todayLog = SheetsDB.getTodayLog(new Date());
  let tasks = [];
  if (todayLog && todayLog.TasksAllocated) {
    try { tasks = JSON.parse(todayLog.TasksAllocated); } catch(e) {}
  }
  
  if (tasks.length > 0) {
    const msg = "It's 12 PM! Time for a mid-day update. How is your progress on today's tasks? Tap a task to mark it done:";
    const keyboard = [];
    
    tasks.forEach(t => {
      if (t.status !== 'done') {
        keyboard.push([{ text: `✅ Mark Done: ${t.topic}`, callback_data: `toggle_task_${t.topic}` }]);
      }
    });
    
    if (keyboard.length > 0) {
      TelegramBot.sendMessage(chatId, msg, { inline_keyboard: keyboard });
    } else {
      TelegramBot.sendMessage(chatId, "It's 12 PM! Great job, it looks like you've already completed all your tasks for today! 🎉");
    }
  } else {
    TelegramBot.sendMessage(chatId, "It's 12 PM! You haven't allocated any tasks for today. Run /task to get started.");
  }
}
