import { useState, useEffect, useMemo } from 'react';
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
import { useNotifications } from '../context/NotificationContext';

// ─── Constants ───
const MAX_FOCUS_PER_DAY = 3;

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { scheduleSystemNotification, cancelSystemNotification } = useNotifications();

    // ─── Real-time listener ───
    useEffect(() => {
        if (!user) {
            setTasks([]);
            setLoading(false);
            return;
        }

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

    // ─── Computed: overdue detection ───
    const todayStr = new Date().toISOString().split('T')[0];

    const tasksWithOverdue = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return tasks.map(task => {
            if (task.status === 'pending' && task.due) {
                const dueDate = new Date(task.due);
                dueDate.setHours(0, 0, 0, 0);
                if (dueDate < today) {
                    return { ...task, isOverdue: true };
                }
            }
            return { ...task, isOverdue: false };
        });
    }, [tasks]);

    // ─── Computed: sorted tasks (focus + overdue priority) ───
    const sortedTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        return [...tasksWithOverdue].sort((a, b) => {
            // Completed tasks always go to bottom
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (b.status === 'completed' && a.status !== 'completed') return -1;
            if (a.status === 'completed' && b.status === 'completed') return 0;

            // Priority order for pending tasks:
            // 1. Focus + Overdue
            // 2. Focus + Today
            // 3. Normal + Overdue
            // 4. Normal + Today
            // 5. Upcoming
            const aIsFocus = a.priority === 'Focus';
            const bIsFocus = b.priority === 'Focus';
            const aIsOverdue = a.isOverdue;
            const bIsOverdue = b.isOverdue;
            const aIsToday = a.due === todayStr;
            const bIsToday = b.due === todayStr;

            const getWeight = (isFocus, isOverdue, isToday) => {
                if (isFocus && isOverdue) return 0;
                if (isFocus && isToday) return 1;
                if (isFocus) return 2;
                if (isOverdue) return 3;
                if (isToday) return 4;
                return 5;
            };

            const weightA = getWeight(aIsFocus, aIsOverdue, aIsToday);
            const weightB = getWeight(bIsFocus, bIsOverdue, bIsToday);

            if (weightA !== weightB) return weightA - weightB;

            // Within same weight, sort by due date ascending
            if (a.due && b.due) return a.due.localeCompare(b.due);
            if (a.due) return -1;
            if (b.due) return 1;
            return 0;
        });
    }, [tasksWithOverdue]);

    // ─── Focus limit check ───
    const getFocusCountForDate = (date) => {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        return tasksWithOverdue.filter(
            t => t.due === dateStr && t.priority === 'Focus' && t.status !== 'completed'
        ).length;
    };

    const canAddFocusForDate = (date) => {
        return getFocusCountForDate(date) < MAX_FOCUS_PER_DAY;
    };

    // ─── Add task ───
    const addTask = async (taskData) => {
        if (!user) return;
        try {
            let notificationId = null;

            // Schedule notifications based on priority
            if (taskData.due && taskData.status === 'pending') {
                if (taskData.priority === 'Focus') {
                    // Focus tasks get 3 notifications: 1hr, 15min, due time
                    const notifications = await scheduleFocusNotifications(taskData);
                    notificationId = notifications; // Store array of IDs
                } else if (taskData.reminder && taskData.reminder.type !== 'none') {
                    const reminderDate = calculateReminderDate(taskData.due, taskData.reminder);
                    if (reminderDate && reminderDate > new Date()) {
                        notificationId = await scheduleSystemNotification(
                            null,
                            "Task Reminder 🔔",
                            `Don't forget: ${taskData.title}`,
                            reminderDate,
                            'task'
                        );
                    }
                }
            }

            const docRef = await addDoc(collection(db, 'tasks'), {
                title: taskData.title,
                desc: taskData.desc || '',
                due: taskData.due || null,
                priority: taskData.priority || 'Normal', // 'Normal' or 'Focus'
                status: 'pending',
                goalId: taskData.goalId || null,
                reminder: taskData.reminder || null,
                userId: user.uid,
                createdAt: serverTimestamp(),
                notificationId,
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

    // ─── Update task ───
    const updateTask = async (taskId, updates, oldGoalId = null) => {
        if (!user) return;
        try {
            const taskRef = doc(db, 'tasks', taskId);

            // Handle notification rescheduling
            if (updates.due !== undefined || updates.reminder !== undefined || updates.title !== undefined || updates.priority !== undefined) {
                const taskToUpdate = tasks.find(t => t.id === taskId);

                // Cancel old notifications
                if (taskToUpdate?.notificationId) {
                    if (Array.isArray(taskToUpdate.notificationId)) {
                        for (const nid of taskToUpdate.notificationId) {
                            await cancelSystemNotification(nid);
                        }
                    } else {
                        await cancelSystemNotification(taskToUpdate.notificationId);
                    }
                    updates.notificationId = null;
                }

                // Schedule new notifications if still pending
                const finalDue = updates.due !== undefined ? updates.due : taskToUpdate?.due;
                const finalReminder = updates.reminder !== undefined ? updates.reminder : taskToUpdate?.reminder;
                const finalTitle = updates.title !== undefined ? updates.title : taskToUpdate?.title;
                const finalStatus = updates.status !== undefined ? updates.status : taskToUpdate?.status;
                const finalPriority = updates.priority !== undefined ? updates.priority : taskToUpdate?.priority;

                if (finalDue && finalStatus === 'pending') {
                    if (finalPriority === 'Focus') {
                        updates.notificationId = await scheduleFocusNotifications({
                            title: finalTitle, due: finalDue
                        });
                    } else if (finalReminder && finalReminder.type !== 'none') {
                        const reminderDate = calculateReminderDate(finalDue, finalReminder);
                        if (reminderDate && reminderDate > new Date()) {
                            updates.notificationId = await scheduleSystemNotification(
                                null,
                                "Task Reminder 🔔",
                                `Don't forget: ${finalTitle}`,
                                reminderDate,
                                'task'
                            );
                        }
                    }
                }
            }

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

    // ─── Delete task ───
    const deleteTask = async (taskId, goalId = null, existingNotificationId = null) => {
        if (!user) return;
        try {
            if (existingNotificationId) {
                if (Array.isArray(existingNotificationId)) {
                    for (const nid of existingNotificationId) {
                        await cancelSystemNotification(nid);
                    }
                } else {
                    await cancelSystemNotification(existingNotificationId);
                }
            }
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

    // ─── Recalculate goal progress (blended: tasks + habits) ───
    const recalculateGoalProgress = async (goalId) => {
        if (!goalId) return;
        try {
            // Get tasks for this goal
            const tasksQuery = query(collection(db, 'tasks'), where('goalId', '==', goalId));
            const tasksSnapshot = await getDocs(tasksQuery);

            const totalTasks = tasksSnapshot.size;
            let completedCount = 0;
            tasksSnapshot.forEach(doc => {
                if (doc.data().status === 'completed') {
                    completedCount++;
                }
            });
            const taskProgress = totalTasks > 0 ? completedCount / totalTasks : -1;

            // Get habits for this goal
            const habitsQuery = query(collection(db, 'habits'), where('goalId', '==', goalId));
            const habitsSnapshot = await getDocs(habitsQuery);

            let habitProgress = -1;
            if (habitsSnapshot.size > 0) {
                let totalConsistency = 0;
                habitsSnapshot.forEach(doc => {
                    totalConsistency += (doc.data().consistencyRate || 0);
                });
                habitProgress = (totalConsistency / habitsSnapshot.size) / 100;
            }

            // Blended progress
            let progress = 0;
            if (taskProgress >= 0 && habitProgress >= 0) {
                // Has both tasks and habits: 60% tasks, 40% habits
                progress = (taskProgress * 0.6) + (habitProgress * 0.4);
            } else if (taskProgress >= 0) {
                // Only tasks
                progress = taskProgress;
            } else if (habitProgress >= 0) {
                // Only habits
                progress = habitProgress;
            }

            await updateDoc(doc(db, 'goals', goalId), { progress });
        } catch (error) {
            console.error("Error recalculating goal progress:", error);
        }
    };

    // ─── Toggle task status (simplified — no recurrence) ───
    const toggleTaskStatus = async (task) => {
        if (!user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dueDateObj = null;
        if (task.due) {
            dueDateObj = new Date(task.due);
            dueDateObj.setHours(0, 0, 0, 0);
        }

        const isMarkingCompleted = task.status !== 'completed';

        let completionData = {};

        if (isMarkingCompleted) {
            completionData.completedAt = serverTimestamp();
            if (dueDateObj && today > dueDateObj) {
                const diffTime = Math.abs(today - dueDateObj);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                completionData.completedLate = true;
                completionData.lateByDays = diffDays;
            } else {
                completionData.completedLate = false;
                completionData.lateByDays = 0;
            }

            // Cancel notifications when completing
            if (task.notificationId) {
                if (Array.isArray(task.notificationId)) {
                    for (const nid of task.notificationId) {
                        await cancelSystemNotification(nid);
                    }
                } else {
                    await cancelSystemNotification(task.notificationId);
                }
                completionData.notificationId = null;
            }
        } else {
            // Un-completing
            completionData.completedAt = null;
            completionData.completedLate = false;
            completionData.lateByDays = 0;
        }

        const newStatus = isMarkingCompleted ? 'completed' : 'pending';
        await updateTask(task.id, {
            status: newStatus,
            ...completionData
        }, task.goalId);

        if (task.goalId) {
            await recalculateGoalProgress(task.goalId);
        }
    };

    // ─── Schedule focus notifications (1hr, 15min, due) ───
    const scheduleFocusNotifications = async (taskData) => {
        if (!taskData.due) return null;

        const ids = [];
        const dueDate = new Date(taskData.due);
        // Default due time is 9 AM if no specific time
        dueDate.setHours(9, 0, 0, 0);

        const oneHourBefore = new Date(dueDate.getTime() - 60 * 60 * 1000);
        const fifteenMinBefore = new Date(dueDate.getTime() - 15 * 60 * 1000);
        const now = new Date();

        try {
            if (oneHourBefore > now) {
                const id = await scheduleSystemNotification(
                    null, "🔥 Focus Task in 1 hour",
                    `${taskData.title} — time to prepare`,
                    oneHourBefore, 'task'
                );
                if (id) ids.push(id);
            }
            if (fifteenMinBefore > now) {
                const id = await scheduleSystemNotification(
                    null, "🔥 Focus Task in 15 min",
                    `${taskData.title} — almost time!`,
                    fifteenMinBefore, 'task'
                );
                if (id) ids.push(id);
            }
            if (dueDate > now) {
                const id = await scheduleSystemNotification(
                    null, "🔥 Focus Task Due Now",
                    `${taskData.title} — it's time!`,
                    dueDate, 'task'
                );
                if (id) ids.push(id);
            }
        } catch (e) {
            console.error('Error scheduling focus notifications:', e);
        }

        return ids.length > 0 ? ids : null;
    };

    // ─── Helper: calculate reminder date ───
    const calculateReminderDate = (dueDateStr, reminder) => {
        if (!dueDateStr || !reminder) return null;
        const [year, month, day] = dueDateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (reminder.type === 'time' && reminder.value) {
            const [hours, minutes] = reminder.value.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);
        } else if (reminder.type === 'period') {
            if (reminder.value === 'morning') date.setHours(9, 0, 0, 0);
            else if (reminder.value === 'evening') date.setHours(18, 0, 0, 0);
        } else {
            return null;
        }
        return date;
    };

    return {
        tasks: sortedTasks,
        loading,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        recalculateGoalProgress,
        getFocusCountForDate,
        canAddFocusForDate,
        MAX_FOCUS_PER_DAY,
    };
}
