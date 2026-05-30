export function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

export function getUserDisplayName(user) {
    return user?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Friend';
}

export function getPrimaryDestination(goals) {
    const active = goals.filter(g => g.status === 'active' || !g.status);
    if (active.length === 0) return null;
    return active.reduce((best, g) => {
        if (!best) return g;
        return (g.progress || 0) > (best.progress || 0) ? g : best;
    }, null);
}

export function getGoalTasks(tasks, goalId) {
    return tasks.filter(t => t.goalId === goalId);
}

export function getCurrentPitStop(tasks, goalId) {
    const goalTasks = getGoalTasks(tasks, goalId).filter(t => t.status === 'pending');
    return goalTasks[0] || null;
}

export function getNextSteps(tasks, limit = 3) {
    const today = new Date().toISOString().split('T')[0];
    const pending = tasks.filter(t => t.status === 'pending');

    const sorted = [...pending].sort((a, b) => {
        const aHigh = a.priority === 'High' ? 0 : 1;
        const bHigh = b.priority === 'High' ? 0 : 1;
        if (aHigh !== bHigh) return aHigh - bHigh;
        const aToday = a.due === today ? 0 : 1;
        const bToday = b.due === today ? 0 : 1;
        if (aToday !== bToday) return aToday - bToday;
        return 0;
    });

    return sorted.slice(0, limit);
}

export function calculateMomentum(tasks) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedThisWeek = tasks.filter(t => {
        if (t.status !== 'completed') return false;
        if (!t.completedAt?.toDate) return true;
        return t.completedAt.toDate() >= weekAgo;
    }).length;

    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const denominator = Math.max(completedThisWeek + pendingCount, 1);
    const raw = Math.round((completedThisWeek / denominator) * 100);
    return Math.min(Math.max(raw, completedThisWeek > 0 ? 20 : 0), 100);
}

export function getCoPilotMessage(profile, tasks, entries) {
    if (!profile) return "I'm here whenever you need support.";

    const completedWeek = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const tone = profile.diary?.emotionalTone;

    if (tone === 'struggling') {
        return "You've been carrying a lot lately. Want to check in?";
    }

    if (completedWeek >= 4) {
        return `You completed ${completedWeek} steps recently. Would you like help planning tomorrow?`;
    }

    if (pending > 5) {
        return "You have several steps ahead. Want help prioritizing?";
    }

    const daysSinceDiary = entries.length === 0 ? 999 : 0;
    if (entries.length > 0) {
        const latest = entries[0];
        if (latest.createdAt?.toDate) {
            const diff = (Date.now() - latest.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24);
            if (diff >= 3) {
                return "You haven't reflected in a few days. Want to check in?";
            }
        }
    } else if (daysSinceDiary > 0) {
        return "Your travel log is waiting. Want to capture today?";
    }

    if (profile.tasks?.overdue > 0) {
        return "Some steps passed their date. Want to replan gently?";
    }

    return "I'm here if you want support with your journey.";
}

export function getMoodEmoji(mood) {
    switch (mood) {
        case 'good': return '😊';
        case 'bad': return '😔';
        default: return '😐';
    }
}

export function getLast7Moods(entries) {
    const sorted = [...entries].sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return aDate - bDate;
    });

    const last7 = sorted.slice(-7);
    while (last7.length < 7) {
        last7.unshift({ mood: null });
    }
    return last7.map(e => (e.mood ? getMoodEmoji(e.mood) : '·'));
}

export function getWeeklyCompletionData(tasks) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = days.map(() => 0);

    tasks.filter(t => t.status === 'completed').forEach(t => {
        let date = null;
        if (t.completedAt?.toDate) date = t.completedAt.toDate();
        else if (t.due) date = new Date(t.due);
        if (date) counts[date.getDay()] += 1;
    });

    const max = Math.max(...counts, 1);
    return days.map((day, i) => ({
        day,
        count: counts[i],
        height: Math.max(12, (counts[i] / max) * 100),
    }));
}

export function getJourneyStats(tasks, goals, entries) {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const milestonesReached = completedTasks.filter(t => t.goalId).length;
    const goalsCompleted = goals.filter(g => g.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'active' || !g.status).length;

    return {
        tasksCompleted: completedTasks.length,
        milestonesReached,
        goalsCompleted,
        activeGoals,
        reflectionsWritten: entries.length,
        momentum: calculateMomentum(tasks),
    };
}

export function isToday(dueStr) {
    if (!dueStr) return false;
    return dueStr === new Date().toISOString().split('T')[0];
}

export function isUpcoming(dueStr) {
    if (!dueStr) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueStr);
    due.setHours(0, 0, 0, 0);
    return due >= today;
}

export function filterTasksByPlanTab(tasks, tab) {
    const today = new Date().toISOString().split('T')[0];
    if (tab === 'Today') {
        return tasks.filter(t => t.status === 'pending' && (t.due === today || !t.due));
    }
    if (tab === 'Upcoming') {
        return tasks.filter(t => t.status === 'pending' && t.due && t.due > today);
    }
    if (tab === 'Completed') {
        return tasks.filter(t => t.status === 'completed');
    }
    return tasks;
}
