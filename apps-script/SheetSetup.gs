// Run this function once manually from the Apps Script Editor to set up the sheets
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const tabs = [
    { name: 'Plan', headers: ['Phase', 'PhaseNum', 'WeekStart', 'WeekEnd', 'Subject', 'Topic', 'SubTopic', 'Status', 'EstimatedMins', 'RevisedDate', 'RevisionReason'] },
    { name: 'DailyLog', headers: ['Date', 'EnergyLevel', 'TimeAvailable', 'TasksAllocated', 'TasksCompleted', 'Status', 'CheckinTime', 'Notes'] },
    { name: 'BusyLog', headers: ['Date', 'Reason', 'Timestamp'] },
    { name: 'QuizResults', headers: ['Date', 'Subject', 'NumQuestions', 'Score', 'Percentage', 'MissedQuestionIDs', 'Duration'] },
    { name: 'QuestionBank', headers: ['QuestionID', 'Subject', 'Category', 'QuestionText', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectOption', 'Explanation'] },
    { name: 'Mistakes', headers: ['Date', 'Subject', 'QuestionID', 'QuestionText', 'MyAnswer', 'CorrectAnswer', 'Explanation'] },
    { name: 'Settings', headers: ['Key', 'Value'] }
  ];

  tabs.forEach(tab => {
    let sheet = ss.getSheetByName(tab.name);
    if (!sheet) {
      sheet = ss.insertSheet(tab.name);
    }
    sheet.clear();
    sheet.appendRow(tab.headers);
    // Format headers
    sheet.getRange(1, 1, 1, tab.headers.length).setFontWeight('bold').setBackground('#f3f3f3');
  });

  // Seed Settings
  const settingsSheet = ss.getSheetByName('Settings');
  settingsSheet.appendRow(['CHECKIN_HOUR', 20]);
  settingsSheet.appendRow(['CHECKIN_MINUTE', 0]);
  settingsSheet.appendRow(['REMINDER_INTERVALS_HRS', '2,6,12']);
  settingsSheet.appendRow(['TIMEZONE', 'Asia/Kolkata']);
  settingsSheet.appendRow(['STREAK_START_DATE', '2026-07-20']);

  // Seed some Plan data
  const planSheet = ss.getSheetByName('Plan');
  const samplePlan = [
    ['Foundation', 0, 'Week 1', 'Week 2', 'Math Refresher', 'Calculus', 'Differentiation rules', 'pending', 45, '', ''],
    ['Foundation', 0, 'Week 1', 'Week 2', 'Math Refresher', 'Calculus', 'Integration basics', 'pending', 45, '', ''],
    ['Foundation', 0, 'Week 1', 'Week 2', 'Math Refresher', 'Algebra', 'Matrices & Eigenvalues', 'pending', 60, '', ''],
    ['Core Electronics I', 1, 'Week 3', 'Week 4', 'Network Theory', 'Node/mesh analysis', '', 'pending', 90, '', ''],
    ['Core Electronics I', 1, 'Week 3', 'Week 4', 'Network Theory', 'Thevenin/Norton', '', 'pending', 90, '', '']
  ];
  samplePlan.forEach(row => planSheet.appendRow(row));

  // Seed QuestionBank
  const qbSheet = ss.getSheetByName('QuestionBank');
  const sampleQs = [
    ['APT001', 'General Aptitude', 'Quantitative', 'If a train 150m long crosses a pole in 15 seconds, what is its speed in km/h?', '36', '45', '54', '60', '36', 'Speed = D/T = 150/15 = 10 m/s. 10 * 18/5 = 36 km/h.'],
    ['APT002', 'General Aptitude', 'Verbal', 'Choose the synonym for "ABUNDANT"', 'Scarce', 'Plentiful', 'Minimal', 'Rare', 'Plentiful', 'Abundant means existing or available in large quantities; plentiful.'],
    ['APT003', 'General Aptitude', 'Reasoning', 'Look at this series: 2, 6, 18, 54, ... What number should come next?', '108', '148', '162', '216', '162', 'Multiply by 3. 54 * 3 = 162.']
  ];
  sampleQs.forEach(row => qbSheet.appendRow(row));

  // Default Sheet1 cleanup
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) {
    ss.deleteSheet(sheet1);
  }
}
