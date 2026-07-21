const Allocator = {
  getCurrentPhaseWeek(dateObj) {
    const settings = SheetsDB.getSettings();
    const startStr = settings.STREAK_START_DATE || '2026-07-20';
    const startDate = new Date(startStr);
    const diffTime = Math.abs(dateObj - startDate);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
    
    // Rough logic based on the spec
    let phaseNum = 0;
    if (diffWeeks >= 3 && diffWeeks <= 8) phaseNum = 1;
    else if (diffWeeks >= 9 && diffWeeks <= 14) phaseNum = 2;
    else if (diffWeeks >= 15 && diffWeeks <= 20) phaseNum = 3;
    else if (diffWeeks >= 21 && diffWeeks <= 23) phaseNum = 4;
    else if (diffWeeks >= 24 && diffWeeks <= 27) phaseNum = 5;
    else if (diffWeeks >= 28) phaseNum = 6;
    
    return { week: diffWeeks, phaseNum: phaseNum };
  },

  allocateTasks(energy, timeStr, dateObj) {
    const plan = SheetsDB.getPlan();
    const currentInfo = this.getCurrentPhaseWeek(dateObj);
    
    // Filter to current phase pending tasks
    const pendingInPhase = plan.filter(p => p.PhaseNum == currentInfo.phaseNum && p.Status !== 'done');
    
    const dateStr = Utilities.formatDate(dateObj, "Asia/Kolkata", "yyyy-MM-dd");
    energy = energy.toLowerCase();
    let allocated = [];
    
    if (energy === 'exhausted') {
      allocated.push({
        topic: 'Review Error Log',
        subject: 'General',
        estimatedMins: 15,
        status: 'pending',
        date: dateStr
      });
    } else if (energy === 'low') {
      allocated.push({
        topic: 'Aptitude Practice (10 Qs)',
        subject: 'General Aptitude',
        estimatedMins: 20,
        status: 'pending',
        date: dateStr
      });
      // Maybe one light revision
      const rev = pendingInPhase.find(p => p.EstimatedMins <= 30);
      if (rev) {
        allocated.push({
          topic: `Revise: ${rev.Topic}`,
          subject: rev.Subject,
          estimatedMins: rev.EstimatedMins,
          status: 'pending',
          date: dateStr
        });
      }
    } else if (energy === 'medium') {
      // One solid new topic OR one PYQ
      if (pendingInPhase.length > 0) {
        const t = pendingInPhase[0];
        allocated.push({
          topic: t.Topic,
          subject: t.Subject,
          estimatedMins: t.EstimatedMins || 60,
          status: 'pending',
          date: dateStr
        });
      }
    } else if (energy === 'high') {
      // Two topics or one long one + PYQ
      if (pendingInPhase.length > 0) {
        const t1 = pendingInPhase[0];
        allocated.push({
          topic: t1.Topic,
          subject: t1.Subject,
          estimatedMins: t1.EstimatedMins || 60,
          status: 'pending',
          date: dateStr
        });
      }
      if (pendingInPhase.length > 1) {
        const t2 = pendingInPhase[1];
        allocated.push({
          topic: `PYQ / Practice: ${t2.Topic}`,
          subject: t2.Subject,
          estimatedMins: 45,
          status: 'pending',
          date: dateStr
        });
      }
    }
    
    SheetsDB.updateDailyLog(dateStr, {
      EnergyLevel: energy,
      TimeAvailable: timeStr,
      TasksAllocated: JSON.stringify(allocated)
    });
    
    return allocated;
  }
};
