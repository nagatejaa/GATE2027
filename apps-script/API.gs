function handleDashboard() {
  const settings = SheetsDB.getSettings();
  const streakStart = new Date(settings.STREAK_START_DATE || '2026-07-20');
  const today = new Date();
  const diffTime = Math.abs(today - streakStart);
  const streakDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const currentPhaseInfo = Allocator.getCurrentPhaseWeek(today);
  const todayLog = SheetsDB.getTodayLog(today);
  
  let todayTasks = [];
  if (todayLog && todayLog.TasksAllocated) {
    try {
      todayTasks = JSON.parse(todayLog.TasksAllocated);
      // Merge with completed statuses
      if (todayLog.TasksCompleted) {
        const completed = JSON.parse(todayLog.TasksCompleted);
        todayTasks = todayTasks.map(t => {
          const compMatch = completed.find(c => c.topic === t.topic);
          if (compMatch) t.status = compMatch.status;
          return t;
        });
      }
    } catch(e) {}
  }

  // Quick stats
  const planData = SheetsDB.getPlan();
  const total = planData.length;
  const done = planData.filter(r => r.Status === 'done').length;
  
  const phaseTopics = planData.filter(r => r.PhaseNum == currentPhaseInfo.phaseNum);
  const phaseDone = phaseTopics.filter(r => r.Status === 'done').length;
  const phaseTotal = phaseTopics.length;
  const phaseProgress = phaseTotal === 0 ? 0 : Math.round((phaseDone / phaseTotal) * 100);

  const insights = Adaptor.getInsights();

  return {
    streak: streakDays,
    currentPhaseName: `Phase ${currentPhaseInfo.phaseNum}`,
    phaseProgress: phaseProgress,
    todayTasks: todayTasks,
    chartData: {
      completed: done,
      pending: total - done
    },
    insights: insights.summary || []
  };
}

function handlePlan() {
  const rawPlan = SheetsDB.getPlan();
  // Group by Phase
  const phasesMap = {};
  rawPlan.forEach(r => {
    const pName = `Phase ${r.PhaseNum}: ${r.Phase}`;
    if (!phasesMap[pName]) {
      phasesMap[pName] = {
        name: pName,
        dateRange: `${r.WeekStart} to ${r.WeekEnd}`, // approximate
        topics: []
      };
    }
    phasesMap[pName].topics.push({
      week: r.WeekStart,
      subject: r.Subject,
      topic: r.Topic,
      status: r.Status || 'pending'
    });
  });
  
  return Object.values(phasesMap);
}

function handleQuizHistory() {
  return {
    scores: SheetsDB.getQuizResults(),
    mistakes: SheetsDB.getMistakes()
  };
}

function handleUpdateTask(params) {
  const dateStr = params.date;
  const topic = params.topic;
  const status = params.status;
  
  SheetsDB.updateTaskStatusInLog(dateStr, topic, status);
  SheetsDB.updateTopicStatus(topic, status);
  
  // Triggers replan check indirectly on Sunday
  return { success: true };
}

function handleSaveSettings(params) {
  if (params.CHECKIN_HOUR !== undefined) SheetsDB.setSetting('CHECKIN_HOUR', params.CHECKIN_HOUR);
  if (params.CHECKIN_MINUTE !== undefined) SheetsDB.setSetting('CHECKIN_MINUTE', params.CHECKIN_MINUTE);
  if (params.REMINDER_INTERVALS_HRS !== undefined) SheetsDB.setSetting('REMINDER_INTERVALS_HRS', params.REMINDER_INTERVALS_HRS);
  return { success: true };
}
