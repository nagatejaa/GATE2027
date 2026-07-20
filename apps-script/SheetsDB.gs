const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');

const SheetsDB = {
  getSpreadsheet() {
    return SpreadsheetApp.openById(SHEET_ID);
  },
  
  getSettings() {
    const sheet = this.getSpreadsheet().getSheetByName('Settings');
    const data = sheet.getDataRange().getValues();
    const settings = {};
    for (let i = 1; i < data.length; i++) {
      settings[data[i][0]] = data[i][1];
    }
    return settings;
  },
  
  setSetting(key, value) {
    const sheet = this.getSpreadsheet().getSheetByName('Settings');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        return;
      }
    }
    sheet.appendRow([key, value]);
  },
  
  getPlan() {
    const sheet = this.getSpreadsheet().getSheetByName('Plan');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const plan = [];
    for (let i = 1; i < data.length; i++) {
      let rowObj = {};
      headers.forEach((h, idx) => rowObj[h] = data[i][idx]);
      plan.push(rowObj);
    }
    return plan;
  },

  updateTopicStatus(topicName, status) {
    const sheet = this.getSpreadsheet().getSheetByName('Plan');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const topicIdx = headers.indexOf('Topic');
    const statusIdx = headers.indexOf('Status');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][topicIdx] === topicName) {
        sheet.getRange(i + 1, statusIdx + 1).setValue(status);
        break;
      }
    }
  },
  
  getTodayLog(dateObj = new Date()) {
    const dateStr = Utilities.formatDate(dateObj, "Asia/Kolkata", "yyyy-MM-dd");
    const sheet = this.getSpreadsheet().getSheetByName('DailyLog');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const dateIdx = headers.indexOf('Date');
    
    for (let i = 1; i < data.length; i++) {
      const rowDate = typeof data[i][dateIdx] === 'object' ? Utilities.formatDate(data[i][dateIdx], "Asia/Kolkata", "yyyy-MM-dd") : data[i][dateIdx];
      if (rowDate === dateStr) {
        let rowObj = {};
        headers.forEach((h, idx) => rowObj[h] = data[i][idx]);
        rowObj.rowIndex = i + 1;
        return rowObj;
      }
    }
    return null;
  },
  
  updateDailyLog(dateStr, fields) {
    const sheet = this.getSpreadsheet().getSheetByName('DailyLog');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const dateIdx = headers.indexOf('Date');
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      const rowDate = typeof data[i][dateIdx] === 'object' ? Utilities.formatDate(data[i][dateIdx], "Asia/Kolkata", "yyyy-MM-dd") : data[i][dateIdx];
      if (rowDate === dateStr) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      // Create new
      const newRow = new Array(headers.length).fill('');
      newRow[dateIdx] = dateStr;
      Object.keys(fields).forEach(k => {
        const idx = headers.indexOf(k);
        if (idx !== -1) newRow[idx] = fields[k];
      });
      sheet.appendRow(newRow);
    } else {
      // Update
      Object.keys(fields).forEach(k => {
        const idx = headers.indexOf(k);
        if (idx !== -1) sheet.getRange(rowIndex, idx + 1).setValue(fields[k]);
      });
    }
  },
  
  updateTaskStatusInLog(dateStr, topic, status) {
    const log = this.getTodayLog(new Date(dateStr));
    if (!log) return;
    
    let completed = [];
    if (log.TasksCompleted) {
      try { completed = JSON.parse(log.TasksCompleted); } catch(e){}
    }
    
    const existing = completed.find(c => c.topic === topic);
    if (existing) {
      existing.status = status;
    } else {
      completed.push({ topic, status });
    }
    
    this.updateDailyLog(dateStr, { TasksCompleted: JSON.stringify(completed) });
  },
  
  appendBusyLog(dateStr, reason) {
    const sheet = this.getSpreadsheet().getSheetByName('BusyLog');
    sheet.appendRow([dateStr, reason, new Date()]);
  },
  
  getQuizQuestions(subject, limit) {
    const sheet = this.getSpreadsheet().getSheetByName('QuestionBank');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    let qs = [];
    for (let i = 1; i < data.length; i++) {
      let rowObj = {};
      headers.forEach((h, idx) => rowObj[h] = data[i][idx]);
      if (rowObj.Subject.toLowerCase() === subject.toLowerCase()) {
        qs.push(rowObj);
      }
    }
    // Shuffle and limit
    qs = qs.sort(() => 0.5 - Math.random()).slice(0, limit);
    return qs;
  },

  appendQuizResult(result) {
    const sheet = this.getSpreadsheet().getSheetByName('QuizResults');
    sheet.appendRow([
      result.Date, result.Subject, result.NumQuestions, 
      result.Score, result.Percentage, result.MissedQuestionIDs, result.Duration
    ]);
  },
  
  appendMistake(mistake) {
    const sheet = this.getSpreadsheet().getSheetByName('Mistakes');
    sheet.appendRow([
      mistake.Date, mistake.Subject, mistake.QuestionID, 
      mistake.QuestionText, mistake.MyAnswer, mistake.CorrectAnswer, mistake.Explanation
    ]);
  },

  getQuizResults() {
    const sheet = this.getSpreadsheet().getSheetByName('QuizResults');
    const data = sheet.getDataRange().getValues();
    const res = [];
    for(let i=1; i<data.length; i++) {
      res.push({
        date: typeof data[i][0] === 'object' ? Utilities.formatDate(data[i][0], "Asia/Kolkata", "yyyy-MM-dd") : data[i][0],
        percentage: data[i][4]
      });
    }
    return res;
  },

  getMistakes() {
    const sheet = this.getSpreadsheet().getSheetByName('Mistakes');
    const data = sheet.getDataRange().getValues();
    const res = [];
    for(let i=1; i<data.length; i++) {
      res.push({
        date: typeof data[i][0] === 'object' ? Utilities.formatDate(data[i][0], "Asia/Kolkata", "yyyy-MM-dd") : data[i][0],
        subject: data[i][1],
        question: data[i][3],
        myAnswer: data[i][4],
        correctAnswer: data[i][5]
      });
    }
    return res;
  }
};
