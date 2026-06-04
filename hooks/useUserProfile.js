import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * useUserProfile
 * Gathers and computes the full behavioral + psychological profile of the user.
 * This is the "brain" that feeds the AI system.
 */
export function useUserProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const buildProfile = useCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setLoading(true);

        try {
            // --- 1. Fetch raw data from Firestore ---
            const [tasksSnap, goalsSnap, habitsSnap, diariesSnap] = await Promise.all([
                getDocs(query(collection(db, 'tasks'), where('userId', '==', user.uid))),
                getDocs(query(collection(db, 'goals'), where('userId', '==', user.uid))),
                getDocs(query(collection(db, 'habits'), where('userId', '==', user.uid))),
                getDocs(query(collection(db, 'diary_entries'), where('userId', '==', user.uid))),
            ]);

            const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const habits = habitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const diaries = diariesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            // --- 2. Task Analytics ---
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'completed');
            const pendingTasks = tasks.filter(t => t.status === 'pending');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const overdueTasks = pendingTasks.filter(t => {
                if (!t.due) return false;
                const d = new Date(t.due);
                d.setHours(0, 0, 0, 0);
                return d < today;
            });

            const taskCompletionRate = totalTasks > 0
                ? Math.round((completedTasks.length / totalTasks) * 100)
                : 0;

            const lateTasks = completedTasks.filter(t => t.completedLate);
            const avgDelayDays = lateTasks.length > 0
                ? Math.round(lateTasks.reduce((sum, t) => sum + (t.lateByDays || 0), 0) / lateTasks.length)
                : 0;

            // --- 3. Goal Analytics ---
            const activeGoals = goals.filter(g => g.status === 'active');
            const completedGoals = goals.filter(g => g.status === 'completed');
            const avgGoalProgress = activeGoals.length > 0
                ? Math.round(activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals.length * 100)
                : 0;

            // --- 3.5 Habit Analytics ---
            const totalHabits = habits.length;
            const avgHabitConsistency = totalHabits > 0
                ? Math.round(habits.reduce((sum, h) => sum + (h.consistencyRate || 0), 0) / totalHabits)
                : 0;
            const highestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);

            // --- 4. Diary / Mood Analytics ---
            const sortedDiaries = diaries
                .sort((a, b) => {
                    const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                    const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                    return bDate - aDate;
                });

            const recentDiaries = sortedDiaries.slice(0, 7);

            const moodCounts = { good: 0, neutral: 0, bad: 0 };
            recentDiaries.forEach(d => {
                if (d.mood && moodCounts[d.mood] !== undefined) moodCounts[d.mood]++;
            });

            // SILENT CONTEXT: Full diary entries for AI empathy calibration.
            // These are NEVER shown to the user or referenced by the AI directly.
            // They only inform the AI's tone, empathy level, and advice style.
            const silentDiaryContext = recentDiaries.slice(0, 5).map(d => ({
                mood: d.mood,
                title: d.title || '',
                // Full content — AI reads but never quotes or references this
                content: d.content || '',
            }));

            // Derive an emotional weight from the diary (for the AI's internal calibration)
            const totalMoods = moodCounts.good + moodCounts.neutral + moodCounts.bad;
            const emotionalTone = totalMoods === 0 ? 'unknown'
                : moodCounts.bad / totalMoods > 0.5 ? 'struggling'
                    : moodCounts.good / totalMoods > 0.6 ? 'thriving'
                        : 'mixed';

            // --- 5. Onboarding Psychological Profile (from user doc) ---
            const onboardingAnswers = user.onboardingAnswers || null;

            // --- 6. Build the complete profile object ---
            const builtProfile = {
                // Identity
                userEmail: user.email,
                userName: user.fullName || user.displayName || user.email?.split('@')[0] || 'Friend',

                // Psychological profile (from onboarding)
                psychology: onboardingAnswers ? {
                    coreProblem: onboardingAnswers.coreProblem,
                    supportPreference: onboardingAnswers.supportPreference,
                    overdueProtocol: onboardingAnswers.overdueProtocol,
                    dailyExecutionTime: onboardingAnswers.dailyExecutionTime,
                } : null,

                // Task behavior
                tasks: {
                    total: totalTasks,
                    completed: completedTasks.length,
                    pending: pendingTasks.length,
                    overdue: overdueTasks.length,
                    completionRate: taskCompletionRate,
                    avgDelayDays,
                    overdueList: overdueTasks.slice(0, 3).map(t => t.title),
                    recentPending: pendingTasks.slice(0, 5).map(t => ({
                        title: t.title,
                        due: t.due,
                        priority: t.priority,
                    })),
                },

                // Goal behavior
                goals: {
                    total: goals.length,
                    active: activeGoals.length,
                    completed: completedGoals.length,
                    avgProgress: avgGoalProgress,
                    activeList: activeGoals.slice(0, 5).map(g => {
                        const relatedTasks = pendingTasks
                            .filter(t => t.goalId === g.id)
                            .slice(0, 3)
                            .map(t => t.title);
                            
                        return {
                            title: g.title,
                            progress: Math.round((g.progress || 0) * 100),
                            tasksLeft: relatedTasks.length > 0 ? relatedTasks : ['None attached']
                        };
                    }),
                },

                // Habit behavior
                habits: {
                    total: totalHabits,
                    avgConsistency: avgHabitConsistency,
                    highestStreak: highestStreak,
                    activeList: habits.map(h => ({
                        title: h.title,
                        streak: h.currentStreak || 0,
                        consistency: h.consistencyRate || 0
                    }))
                },

                // PUBLIC diary stats (can be referenced)
                diary: {
                    totalEntries: diaries.length,
                    recentMoods: moodCounts,
                    emotionalTone,
                },

                // SILENT context (for AI empathy calibration ONLY — never reference this to the user)
                silentDiaryContext,
            };

            setProfile(builtProfile);
        } catch (error) {
            console.error('Error building user profile:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        buildProfile();
    }, [buildProfile]);

    return { profile, loading, refreshProfile: buildProfile };
}
