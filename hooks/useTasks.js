import { useState, useEffect } from 'react';
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
    getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setTasks([]);
            setLoading(false);
            return;
        }

        // Query tasks collection for the current user
        const q = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const tasksData = [];
            querySnapshot.forEach((doc) => {
                tasksData.push({ id: doc.id, ...doc.data() });
            });
            setTasks(tasksData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tasks:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addTask = async (taskData) => {
        if (!user) return;
        try {
            const docRef = await addDoc(collection(db, 'tasks'), {
                ...taskData,
                userId: user.uid,
                createdAt: serverTimestamp(),
                status: 'pending', // default status
            });
            if (taskData.goalId) {
                await recalculateGoalProgress(taskData.goalId);
            }
            return docRef;
        } catch (error) {
            console.error("Error adding task:", error);
            throw error;
        }
    };

    const updateTask = async (taskId, updates, oldGoalId = null) => {
        if (!user) return;
        try {
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, updates);

            if (updates.goalId) {
                await recalculateGoalProgress(updates.goalId);
            }
            if (oldGoalId && oldGoalId !== updates.goalId) {
                await recalculateGoalProgress(oldGoalId);
            }
        } catch (error) {
            console.error("Error updating task:", error);
            throw error;
        }
    };

    const deleteTask = async (taskId, goalId = null) => {
        if (!user) return;
        try {
            const taskRef = doc(db, 'tasks', taskId);
            await deleteDoc(taskRef);

            if (goalId) {
                await recalculateGoalProgress(goalId);
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            throw error;
        }
    };

    const recalculateGoalProgress = async (goalId) => {
        if (!goalId) return;
        try {
            // Get all tasks for this goal
            const tasksQuery = query(collection(db, 'tasks'), where('goalId', '==', goalId));
            const tasksSnapshot = await getDocs(tasksQuery);

            const totalTasks = tasksSnapshot.size;
            if (totalTasks === 0) {
                await updateDoc(doc(db, 'goals', goalId), { progress: 0 });
                return;
            }

            let completedCount = 0;
            tasksSnapshot.forEach(doc => {
                if (doc.data().status === 'completed') {
                    completedCount++;
                }
            });

            const progress = completedCount / totalTasks;
            await updateDoc(doc(db, 'goals', goalId), { progress });
        } catch (error) {
            console.error("Error recalculating goal progress:", error);
        }
    };

    const toggleTaskStatus = async (task) => {
        if (!user) return;

        // Logic for Recurrence
        if (task.status === 'pending' && task.recurrence && typeof task.recurrence === 'object' && task.recurrence.type !== 'none') {
            // It is a recurring task being marked as done

            // 2. Clone and create a NEW task for the next occurrence
            const nextDate = new Date();
            // We use today as the base for the next interval so it doesn't drift if they are late
            // (or use task.due if strict schedule preferred - usually 'from completion' is friendlier)

            const interval = task.recurrence.interval || 1;

            if (task.recurrence.type === 'daily') {
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (task.recurrence.type === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (task.recurrence.type === 'custom') {
                nextDate.setDate(nextDate.getDate() + interval);
            }

            const nextDueStr = nextDate.toISOString().split('T')[0];

            // Create the new task
            const newDocRef = await addDoc(collection(db, 'tasks'), {
                title: task.title,
                desc: task.desc || '',
                priority: task.priority || 'Normal',
                userId: user.uid,
                createdAt: serverTimestamp(),
                status: 'pending',
                due: nextDueStr,
                recurrence: task.recurrence,
                reminder: task.reminder || null
            });

            // 1. Mark the current task as completed (preserve history) AND LINK the next one
            await updateTask(task.id, {
                status: 'completed',
                nextOccurrenceId: newDocRef.id
            }, task.goalId);

            if (task.goalId) {
                await recalculateGoalProgress(task.goalId);
            }
            return;
        }

        // Logic for UNDOING a recurring task completion
        // If we are marking a completed task as pending, check if it spawned a next occurrence.
        if (task.status === 'completed' && task.nextOccurrenceId) {
            try {
                // Delete the future task that was created automatically
                await deleteTask(task.nextOccurrenceId);
            } catch (e) {
                console.log("Could not delete next occurrence (maybe already deleted):", e);
            }

            // Unmark the current task and clear the link
            await updateTask(task.id, {
                status: 'pending',
                nextOccurrenceId: null
            }, task.goalId);

            if (task.goalId) {
                await recalculateGoalProgress(task.goalId);
            }
            return;
        }

        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        await updateTask(task.id, { status: newStatus }, task.goalId);

        if (task.goalId) {
            await recalculateGoalProgress(task.goalId);
        }
    };

    return {
        tasks,
        loading,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        recalculateGoalProgress
    };
}
