const TELEGRAM_BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const TelegramBot = {
  sendMessage(chatId, text, replyMarkup = null) {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    };
    if (replyMarkup) {
      payload.reply_markup = JSON.stringify(replyMarkup);
    }
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    };
    
    try {
      UrlFetchApp.fetch(`${TELEGRAM_URL}/sendMessage`, options);
    } catch(e) {
      console.error("Telegram send error:", e);
    }
  }
};

function handleTelegramWebhook(e) {
  try {
    const update = JSON.parse(e.postData.contents);
    const settings = SheetsDB.getSettings();
    
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Save Chat ID if not set
      if (!settings.TELEGRAM_CHAT_ID) {
        SheetsDB.setSetting('TELEGRAM_CHAT_ID', chatId);
      }
      
      if (text === '/start') {
        TelegramBot.sendMessage(chatId, "Welcome to your GATE EC 2027 Tracker! I'll check in with you daily. Use /quizaptitude to practice.");
        return ContentService.createTextOutput("OK");
      }
      
      if (text === '/quizaptitude') {
        TelegramBot.sendMessage(chatId, "How many questions do you want?", {
          inline_keyboard: [
            [{ text: "5", callback_data: "quiz_apt_5" }, { text: "10", callback_data: "quiz_apt_10" }]
          ]
        });
        return ContentService.createTextOutput("OK");
      }
      
      // Check if it's a busy reason reply
      const userState = CacheService.getScriptCache().get(`state_${chatId}`);
      if (userState === 'WAITING_BUSY_REASON') {
        const dateStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
        SheetsDB.appendBusyLog(dateStr, text);
        SheetsDB.updateDailyLog(dateStr, { Status: 'skipped' });
        CacheService.getScriptCache().remove(`state_${chatId}`);
        TelegramBot.sendMessage(chatId, "Got it. Reason logged. See you tomorrow, take care!");
        return ContentService.createTextOutput("OK");
      }

    } else if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;
      
      if (data.startsWith('energy_')) {
        const energy = data.split('_')[1];
        if (energy === 'busy') {
          CacheService.getScriptCache().put(`state_${chatId}`, 'WAITING_BUSY_REASON', 3600);
          TelegramBot.sendMessage(chatId, "I understand. What's the reason today?");
        } else {
          // Store energy and ask for time
          CacheService.getScriptCache().put(`energy_${chatId}`, energy, 3600);
          TelegramBot.sendMessage(chatId, "How much time can you invest?", {
            inline_keyboard: [
              [{ text: "30 min", callback_data: "time_30" }, { text: "1 hr", callback_data: "time_60" }],
              [{ text: "2 hrs", callback_data: "time_120" }, { text: "3+ hrs", callback_data: "time_180" }]
            ]
          });
        }
      } else if (data.startsWith('time_')) {
        const timeStr = data.split('_')[1] + ' min';
        const energy = CacheService.getScriptCache().get(`energy_${chatId}`);
        
        const tasks = Allocator.allocateTasks(energy, timeStr, new Date());
        let msg = `*Tasks for Today*\n\n`;
        tasks.forEach(t => {
          msg += `- ${t.topic} (${t.subject}, ~${t.estimatedMins}m)\n`;
        });
        
        TelegramBot.sendMessage(chatId, msg + `\nLet's get it done! Head to the dashboard to mark them complete.`);
      } else if (data.startsWith('quiz_apt_')) {
        const num = parseInt(data.split('_')[2]);
        TelegramBot.sendMessage(chatId, `Starting a quiz with ${num} questions... (Quiz engine full implementation goes here)`);
      }
    }
    
    return ContentService.createTextOutput("OK");
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput("Error");
  }
}
