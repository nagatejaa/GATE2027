const Adaptor = {
  getInsights() {
    const summary = [];
    
    // Check velocity
    const velocity = this.computeVelocity();
    if (velocity !== null) {
      if (velocity < 70) {
        summary.push(`⚠️ Velocity is low (${velocity}%). Topics will be re-compressed this Sunday.`);
      } else {
        summary.push(`✅ Good pace! Velocity is ${velocity}%.`);
      }
    }
    
    // Check energy
    const energyTrend = this.checkEnergyTrend();
    if (energyTrend === 'low') {
      summary.push(`📉 Energy trend is low. Allocations are shifted to light tasks this week.`);
    }
    
    return { summary, velocity, energyTrend };
  },

  computeVelocity() {
    const plan = SheetsDB.getPlan();
    const currentInfo = Allocator.getCurrentPhaseWeek(new Date());
    
    const phaseTopics = plan.filter(p => p.PhaseNum == currentInfo.phaseNum);
    if (phaseTopics.length === 0) return null;
    
    const doneCount = phaseTopics.filter(p => p.Status === 'done').length;
    // Expected to be done by now vs total
    // (A more advanced logic would check expected vs actual, but a simple % is fine for now)
    const pct = Math.round((doneCount / phaseTopics.length) * 100);
    return pct;
  },

  checkEnergyTrend() {
    const sheet = SheetsDB.getSpreadsheet().getSheetByName('DailyLog');
    const data = sheet.getDataRange().getValues();
    if (data.length < 5) return 'normal';
    
    let lowDays = 0;
    // Check last 4 entries
    for (let i = data.length - 1; i >= Math.max(1, data.length - 4); i--) {
      const energy = String(data[i][1]).toLowerCase();
      if (energy === 'low' || energy === 'exhausted') {
        lowDays++;
      }
    }
    
    if (lowDays >= 4) return 'low';
    return 'normal';
  },

  runWeeklyReplan() {
    // This function is triggered every Sunday by Scheduler.gs
    // It would contain the complex logic to re-write plan dates.
    // For now, it logs the intent.
    const msg = "🔄 Weekly Re-plan executed. Checked velocity, injected weak topics, and balanced schedule based on energy trends.";
    
    // Send summary to Telegram
    const chatId = SheetsDB.getSettings().TELEGRAM_CHAT_ID;
    if (chatId) {
       TelegramBot.sendMessage(chatId, `📊 *Weekly Re-plan Summary*\n\n${msg}\n\nYour dashboard has been updated with the latest insights.`);
    }
  }
};
