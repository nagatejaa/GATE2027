const CONFIG = {
  TOKEN: 'GATE2027-xK9mP2qR-NAGA'
};

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  // Telegram webhooks come as POST with ?action=telegram-webhook
  // ALWAYS return OK to Telegram, otherwise it retries every 1 min causing spam
  if (e.parameter && e.parameter.action === 'telegram-webhook') {
    try {
      handleTelegramWebhook(e);
    } catch(err) {
      console.error('doPost top-level error: ' + err.message);
    }
    return ContentService.createTextOutput('OK');
  }
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  const p = e.parameter || {};
  
  // Validate token
  if (p.token !== CONFIG.TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    let result = {};
    const action = p.action;
    
    if (method === 'GET') {
      if (action === 'dashboard') result = handleDashboard();
      else if (action === 'plan') result = handlePlan();
      else if (action === 'quiz-history') result = handleQuizHistory();
      else if (action === 'settings') result = SheetsDB.getSettings();
      else if (action === 'insights') result = Adaptor.getInsights();
      else result = { error: 'Unknown GET action' };
    } else if (method === 'POST') {
      if (action === 'update-task') {
        result = handleUpdateTask(p);
      } else if (action === 'save-settings') {
        result = handleSaveSettings(p);
      } else {
        result = { error: 'Unknown POST action' };
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message, stack: err.stack })).setMimeType(ContentService.MimeType.JSON);
  }
}
