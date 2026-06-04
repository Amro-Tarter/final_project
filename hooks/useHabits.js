import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function useHabits() {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // ─── Real-time listener for habits ───
    useEffect(() => {
        if (!user) {
            setHabits([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'habits'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            // Sort locally to avoid Firebase index requirement
            data.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA; // desc
            });
            setHabits(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching habits:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // ─── Add a new habit ───
    const addHabit = async (habitData) => {
        if (!user) throw new Error('User is not authenticated');

        try {
            const docRef = await addDoc(collection(db, 'habits'), {
                ...habitData,
                userId: user.uid,
                status: 'active',
                completedOccurrences: 0,
                currentStreak: 0,
                bestStreak: 0,
                consistencyRate: 0,
                createdAt: serverTimestamp(),
            });
            return { id: docRef.id, ...habitData };
        } catch (error) {
            console.error("Error adding habit:", error);
            throw error;
        }
    };

    // ─── Update a habit ───
    const updateHabit = async (habitId, updates) => {
        if (!user) return;
        try {
            const habitRef = doc(db, 'habits', habitId);
            await updateDoc(habitRef, updates);
        } catch (error) {
            console.error("Error updating habit:", error);
            throw error;
        }
    };

    // ─── Delete a habit and all its occurrences ───
    const deleteHabit = async (habitId) => {
        if (!user) return;
        try {
            // Delete all occurrences for this habit
            const occQuery = query(
                collection(db, 'habit_occurrences'),
                where('habitId', '==', habitId),
                where('userId', '==', user.uid)
            );
            const occSnap = await getDocs(occQuery);
            const batch = writeBatch(db);
            occSnap.forEach((d) => {
                batch.delete(d.ref);
            });
            // Delete the habit itself
            batch.delete(doc(db, 'habits', habitId));
            await batch.commit();
        } catch (error) {
            console.error("Error deleting habit:", error);
            throw error;
        }
    };

    // ─── Check in a habit for a given date ───
    const checkInHabit = async (habitId, date) => {
        if (!user) return;
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

        try {
            // Check if already checked in for this date
            const existingQuery = query(
                collection(db, 'habit_occurrences'),
                where('habitId', '==', habitId),
                where('userId', '==', user.uid),
                where('date', '==', dateStr)
            );
            const existingSnap = await getDocs(existingQuery);

            if (!existingSnap.empty) {
                // Already exists — update to completed if it was missed
                const existingDoc = existingSnap.docs[0];
                if (existingDoc.data().status !== 'completed') {
                    await updateDoc(existingDoc.ref, { status: 'completed' });
                }
            } else {
                // Create new occurrence
                await addDoc(collection(db, 'habit_occurrences'), {
                    habitId,
                    userId: user.uid,
                    date: dateStr,
                    status: 'completed',
                    createdAt: serverTimestamp(),
                });
            }

            // Recalculate streak and consistency for this habit
            await recalculateHabitStats(habitId);
        } catch (error) {
            console.error("Error checking in habit:", error);
            throw error;
        }
    };

    // ─── Uncheck a habit for a given date ───
    const uncheckHabit = async (habitId, date) => {
        if (!user) return;
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

        try {
            const existingQuery = query(
                collection(db, 'habit_occurrences'),
                where('habitId', '==', habitId),
                where('userId', '==', user.uid),
                where('date', '==', dateStr)
            );
            const existingSnap = await getDocs(existingQuery);

            if (!existingSnap.empty) {
                // Delete the occurrence
                const batch = writeBatch(db);
                existingSnap.forEach((d) => batch.delete(d.ref));
                await batch.commit();
            }

            await recalculateHabitStats(habitId);
        } catch (error) {
            console.error("Error unchecking habit:", error);
            throw error;
        }
    };

    // ─── Check if habit is completed for a given date ───
    const isHabitCompletedForDate = useCallback(async (habitId, date) => {
        if (!user) return false;
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

        try {
            const q = query(
                collection(db, 'habit_occurrences'),
                where('habitId', '==', habitId),
                where('userId', '==', user.uid),
                where('date', '==', dateStr),
                where('status', '==', 'completed')
            );
            const snap = await getDocs(q);
            return !snap.empty;
        } catch (error) {
            console.error("Error checking habit completion:", error);
            return false;
        }
    }, [user]);

    // ─── Get all occurrences for a habit (for analytics/calendar) ───
    const getOccurrences = async (habitId, startDate, endDate) => {
        if (!user) return [];

        try {
            let q = query(
                collection(db, 'habit_occurrences'),
                where('habitId', '==', habitId),
                where('userId', '==', user.uid),
                where('status', '==', 'completed')
            );

            const snap = await getDocs(q);
            const occurrences = [];
            snap.forEach((d) => {
                const data = d.data();
                if (startDate && data.date < startDate) return;
                if (endDate && data.date > endDate) return;
                occurrences.push({ id: d.id, ...data });
            });

            return occurrences.sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            console.error("Error fetching occurrences:", error);
            return [];
        }
    };

    // ─── Recalculate streak and consistency for a habit ───
    const recalculateHabitStats = async (habitId) => {
        if (!user) return;

        try {
            const habit = habits.find(h => h.id === habitId);
            if (!habit) return;

            // Get all completed occurrences
            const occQuery = query(
                collection(db, 'habit_occurrences'),
                where('habitId', '==', habitId),
                where('userId', '==', user.uid),
                where('status', '==', 'completed')
            );
            const occSnap = await getDocs(occQuery);

            const completedDates = new Set();
            occSnap.forEach((d) => {
                completedDates.add(d.data().date);
            });

            const completedOccurrences = completedDates.size;

            // Calculate expected occurrences
            const startDate = habit.startDate
                ? new Date(habit.startDate)
                : (habit.createdAt?.toDate ? habit.createdAt.toDate() : new Date());
            const endDate = habit.endDate ? new Date(habit.endDate) : new Date();
            const today = new Date();
            const effectiveEnd = endDate < today ? endDate : today;

            const expectedOccurrences = calculateExpectedOccurrences(
                startDate,
                effectiveEnd,
                habit.frequency || 'daily',
                habit.interval || 1
            );

            // Calculate current streak (consecutive days ending today, going backwards)
            const currentStreak = calculateCurrentStreak(completedDates, habit.frequency, habit.interval);

            // Calculate best streak
            const bestStreak = calculateBestStreak(completedDates, habit.frequency, habit.interval);

            // Consistency rate
            const consistencyRate = expectedOccurrences > 0
                ? Math.round((completedOccurrences / expectedOccurrences) * 100)
                : 0;

            // Update the habit document
            await updateDoc(doc(db, 'habits', habitId), {
                completedOccurrences,
                currentStreak: Math.max(currentStreak, 0),
                bestStreak: Math.max(bestStreak, habit.bestStreak || 0),
                consistencyRate: Math.min(consistencyRate, 100),
            });
        } catch (error) {
            console.error("Error recalculating habit stats:", error);
        }
    };

    // ─── Get habits linked to a specific goal ───
    const getHabitsForGoal = useCallback((goalId) => {
        return habits.filter(h => h.goalId === goalId);
    }, [habits]);

    // ─── Get today's habits with their completion status ───
    const getTodaysHabits = useCallback(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...

        return habits.filter(h => {
            if (h.status !== 'active') return false;

            // Check if habit applies today based on frequency
            if (h.frequency === 'daily') return true;
            if (h.frequency === 'weekly') {
                // Weekly habits: check if today is the day
                // Default to the day the habit was created
                return true; // Show weekly habits every day, user checks in when they do it
            }
            if (h.frequency === 'custom') {
                // Custom interval: always show, streak logic handles the rest
                return true;
            }
            return true;
        });
    }, [habits]);

    return {
        habits,
        loading,
        addHabit,
        updateHabit,
        deleteHabit,
        checkInHabit,
        uncheckHabit,
        isHabitCompletedForDate,
        getOccurrences,
        recalculateHabitStats,
        getHabitsForGoal,
        getTodaysHabits,
    };
}

// ─── Helper: Calculate expected occurrences between two dates ───
function calculateExpectedOccurrences(startDate, endDate, frequency, interval = 1) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < start) return 0;

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

    if (frequency === 'daily') {
        return Math.ceil(diffDays / interval);
    }
    if (frequency === 'weekly') {
        return Math.ceil(diffDays / 7);
    }
    if (frequency === 'custom') {
        return Math.ceil(diffDays / interval);
    }
    return diffDays;
}

// ─── Helper: Calculate current streak ───
function calculateCurrentStreak(completedDates, frequency, interval = 1) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = new Date(today);

    const step = frequency === 'weekly' ? 7 : (frequency === 'custom' ? interval : 1);

    // Check today first
    const todayStr = checkDate.toISOString().split('T')[0];
    if (completedDates.has(todayStr)) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - step);
    } else {
        // If today isn't done yet, check from yesterday
        checkDate.setDate(checkDate.getDate() - step);
        const yesterdayStr = checkDate.toISOString().split('T')[0];
        if (!completedDates.has(yesterdayStr)) {
            return 0;
        }
        streak = 1;
        checkDate.setDate(checkDate.getDate() - step);
    }

    // Count backwards
    for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (completedDates.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - step);
        } else {
            break;
        }
    }

    return streak;
}

// ─── Helper: Calculate best streak ever ───
function calculateBestStreak(completedDates, frequency, interval = 1) {
    if (completedDates.size === 0) return 0;

    const sorted = Array.from(completedDates).sort();
    const step = frequency === 'weekly' ? 7 : (frequency === 'custom' ? interval : 1);

    let bestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i - 1]);
        const currDate = new Date(sorted[i]);
        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

        if (diffDays === step) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
        } else if (diffDays > step) {
            currentStreak = 1;
        }
        // if diffDays < step, same period — don't break streak
    }

    return bestStreak;
}
