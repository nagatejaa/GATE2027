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
  // Guard: if called without a real POST body (e.g. from the Script Editor Run button), exit safely
  if (!e || !e.postData || !e.postData.contents) {
    console.log('handleTelegramWebhook called without postData - ignoring.');
    return ContentService.createTextOutput('OK');
  }
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
        TelegramBot.sendMessage(chatId, "Welcome to your GATE EC 2027 Tracker! I'll check in with you daily. Use /task to view tasks, or /quizaptitude to practice.");
        return ContentService.createTextOutput("OK");
      }
      
      if (text === '/task') {
        const todayLog = SheetsDB.getTodayLog(new Date());
        let tasks = [];
        if (todayLog && todayLog.TasksAllocated) {
          try { tasks = JSON.parse(todayLog.TasksAllocated); } catch(e) {}
        }
        
        if (tasks.length > 0) {
          let msg = `*Today's Tasks:*\n\n`;
          tasks.forEach(t => {
            msg += `- ${t.topic} (${t.estimatedMins}m) [${t.status}]\n`;
          });
          msg += `\nDo you want to start now?`;
          
          TelegramBot.sendMessage(chatId, msg, {
            inline_keyboard: [
              [{ text: "Yes, let's start! 🚀", callback_data: "task_start_yes" }],
              [{ text: "Not now ⌛", callback_data: "task_start_no" }],
              [{ text: "Modify Tasks ⚙️", callback_data: "start_checkin" }]
            ]
          });
        } else {
          TelegramBot.sendMessage(chatId, "You haven't allocated any tasks for today yet. Let's do a check-in!", {
            inline_keyboard: [[{ text: "Allocate Tasks 📅", callback_data: "start_checkin" }]]
          });
        }
        return ContentService.createTextOutput("OK");
      }
      
      if (text === '/nightupdate') {
        const todayLog = SheetsDB.getTodayLog(new Date());
        let tasks = [];
        if (todayLog && todayLog.TasksAllocated) {
          try { tasks = JSON.parse(todayLog.TasksAllocated); } catch(e) {}
        }
        
        let msg = "🌙 Good night! Let's wrap up today and plan for tomorrow.\n\nHere are today's tasks:\n";
        tasks.forEach(t => {
           msg += `- ${t.topic} [${t.status}]\n`;
        });
        msg += "\nPlease ensure your tasks are marked correctly on your dashboard or via /task.\n\nReady to plan tomorrow?";
        
        TelegramBot.sendMessage(chatId, msg, {
          inline_keyboard: [[{ text: "Plan Tomorrow 🌅", callback_data: "plan_tomorrow" }]]
        });
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
      } else if (userState === 'WAITING_TOMORROW_BUSY_REASON') {
        const dateStr = Utilities.formatDate(new Date(Date.now() + 86400000), "Asia/Kolkata", "yyyy-MM-dd");
        SheetsDB.appendBusyLog(dateStr, text);
        SheetsDB.updateDailyLog(dateStr, { Status: 'skipped' });
        CacheService.getScriptCache().remove(`state_${chatId}`);
        TelegramBot.sendMessage(chatId, "Got it. Reason logged for tomorrow. Take care!");
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
      } else if (data === 'plan_tomorrow') {
        TelegramBot.sendMessage(chatId, "How's your expected energy for tomorrow?", {
          inline_keyboard: [
            [{ text: "High ⚡", callback_data: "tomorrow_energy_high" }, { text: "Medium 🔋", callback_data: "tomorrow_energy_medium" }],
            [{ text: "Low 🪫", callback_data: "tomorrow_energy_low" }, { text: "Exhausted 😴", callback_data: "tomorrow_energy_exhausted" }],
            [{ text: "Tomorrow is busy 🚫", callback_data: "tomorrow_energy_busy" }]
          ]
        });
      } else if (data.startsWith('tomorrow_energy_')) {
        const energy = data.split('_')[2];
        if (energy === 'busy') {
           CacheService.getScriptCache().put(`state_${chatId}`, 'WAITING_TOMORROW_BUSY_REASON', 3600);
           TelegramBot.sendMessage(chatId, "I understand. What's the reason for tomorrow?");
        } else {
           CacheService.getScriptCache().put(`tomorrow_energy_${chatId}`, energy, 3600);
           TelegramBot.sendMessage(chatId, "How much time can you invest tomorrow?", {
             inline_keyboard: [
               [{ text: "30 min", callback_data: "tomorrow_time_30" }, { text: "1 hr", callback_data: "tomorrow_time_60" }],
               [{ text: "2 hrs", callback_data: "tomorrow_time_120" }, { text: "3+ hrs", callback_data: "tomorrow_time_180" }]
             ]
           });
        }
      } else if (data.startsWith('tomorrow_time_')) {
        const timeStr = data.split('_')[2] + ' min';
        const energy = CacheService.getScriptCache().get(`tomorrow_energy_${chatId}`);
        const tomorrow = new Date(Date.now() + 86400000);
        
        const tasks = Allocator.allocateTasks(energy, timeStr, tomorrow);
        let msg = `*Tasks for Tomorrow*\n\n`;
        tasks.forEach(t => {
          msg += `- ${t.topic} (${t.subject}, ~${t.estimatedMins}m)\n`;
        });
        
        TelegramBot.sendMessage(chatId, msg + `\nAll set! Get some rest. 🌙`);
      } else if (data.startsWith('quiz_apt_')) {
        const num = parseInt(data.split('_')[2]);
        TelegramBot.sendMessage(chatId, `Fetching ${num} questions...`);
        const qs = SheetsDB.getQuizQuestions('General Aptitude', num);
        if (qs.length === 0) {
          TelegramBot.sendMessage(chatId, "No questions found in QuestionBank for General Aptitude.");
        } else {
          const state = {
            questions: qs,
            index: 0,
            score: 0,
            mistakes: [],
            startTime: new Date().getTime()
          };
          CacheService.getScriptCache().put(`quiz_state_${chatId}`, JSON.stringify(state), 21600);
          sendNextQuizQuestion(chatId, state);
        }
      } else if (data.startsWith('qans_')) {
        const parts = data.split('_');
        const qIndex = parseInt(parts[1]);
        const selectedOption = parts[2]; // A, B, C, D
        
        const stateStr = CacheService.getScriptCache().get(`quiz_state_${chatId}`);
        if (stateStr) {
          const state = JSON.parse(stateStr);
          if (state.index === qIndex) {
            const q = state.questions[qIndex];
            const correctOptionKey = getOptionKeyByValue(q, q.CorrectOption);
            
            if (selectedOption === correctOptionKey) {
              state.score++;
              TelegramBot.sendMessage(chatId, `✅ Correct!\n\n_Explanation:_ ${q.Explanation}`);
            } else {
              const wrongAnsText = q['Option' + selectedOption];
              TelegramBot.sendMessage(chatId, `❌ Incorrect.\nCorrect Answer: ${q.CorrectOption}\n\n_Explanation:_ ${q.Explanation}`);
              state.mistakes.push({
                Date: Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd"),
                Subject: q.Subject,
                QuestionID: q.QuestionID,
                QuestionText: q.QuestionText,
                MyAnswer: wrongAnsText,
                CorrectAnswer: q.CorrectOption,
                Explanation: q.Explanation
              });
            }
            
            state.index++;
            if (state.index < state.questions.length) {
              CacheService.getScriptCache().put(`quiz_state_${chatId}`, JSON.stringify(state), 21600);
              Utilities.sleep(1000); // short pause
              sendNextQuizQuestion(chatId, state);
            } else {
              // Quiz Finished
              CacheService.getScriptCache().remove(`quiz_state_${chatId}`);
              const duration = Math.round((new Date().getTime() - state.startTime) / 60000);
              const pct = Math.round((state.score / state.questions.length) * 100);
              
              SheetsDB.appendQuizResult({
                Date: Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd"),
                Subject: state.questions[0].Subject,
                NumQuestions: state.questions.length,
                Score: state.score,
                Percentage: pct,
                MissedQuestionIDs: state.mistakes.map(m => m.QuestionID).join(','),
                Duration: duration
              });
              
              state.mistakes.forEach(m => SheetsDB.appendMistake(m));
              
              TelegramBot.sendMessage(chatId, `🎉 *Quiz Finished!*\n\nScore: ${state.score} / ${state.questions.length} (${pct}%)\nTime taken: ~${duration} mins.\nResults logged to dashboard.`);
            }
          } else {
            TelegramBot.sendMessage(chatId, "This question has already been answered.");
          }
        } else {
          TelegramBot.sendMessage(chatId, "Quiz session expired.");
        }
      } else if (data === 'start_checkin') {
        TelegramBot.sendMessage(chatId, "How's your energy today?", {
          inline_keyboard: [
            [{ text: "High ⚡", callback_data: "energy_high" }, { text: "Medium 🔋", callback_data: "energy_medium" }],
            [{ text: "Low 🪫", callback_data: "energy_low" }, { text: "Exhausted 😴", callback_data: "energy_exhausted" }],
            [{ text: "Today is busy 🚫", callback_data: "energy_busy" }]
          ]
        });
      } else if (data === 'task_start_yes') {
        TelegramBot.sendMessage(chatId, "Awesome! Timer started. Stay focused and crush it! 🚀");
      } else if (data === 'task_start_no') {
        TelegramBot.sendMessage(chatId, "No problem! Take your time, let me know when you're ready.");
      } else if (data.startsWith('toggle_task_')) {
        const topic = data.replace('toggle_task_', '');
        const dateStr = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
        SheetsDB.updateTaskStatusInLog(dateStr, topic, 'done');
        SheetsDB.updateTopicStatus(topic, 'done');
        TelegramBot.sendMessage(chatId, `✅ Marked "${topic}" as done!`);
      }
    }
    
    return ContentService.createTextOutput("OK");
  } catch (err) {
    console.error("Webhook Error: " + err.message, err.stack);
    // Return OK to prevent Telegram from infinitely retrying the failed message
    return ContentService.createTextOutput("OK");
  }
}

function sendNextQuizQuestion(chatId, state) {
  const q = state.questions[state.index];
  const msg = `*Question ${state.index + 1} of ${state.questions.length}*\n\n${q.QuestionText}\n\nA) ${q.OptionA}\nB) ${q.OptionB}\nC) ${q.OptionC}\nD) ${q.OptionD}`;
  
  TelegramBot.sendMessage(chatId, msg, {
    inline_keyboard: [
      [
        { text: "A", callback_data: `qans_${state.index}_A` },
        { text: "B", callback_data: `qans_${state.index}_B` }
      ],
      [
        { text: "C", callback_data: `qans_${state.index}_C` },
        { text: "D", callback_data: `qans_${state.index}_D` }
      ]
    ]
  });
}

function getOptionKeyByValue(q, value) {
  if (String(q.OptionA).trim() === String(value).trim()) return 'A';
  if (String(q.OptionB).trim() === String(value).trim()) return 'B';
  if (String(q.OptionC).trim() === String(value).trim()) return 'C';
  if (String(q.OptionD).trim() === String(value).trim()) return 'D';
  return 'A'; // fallback
}
