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
    serverTimestamp
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
            await addDoc(collection(db, 'tasks'), {
                ...taskData,
                userId: user.uid,
                createdAt: serverTimestamp(),
                status: 'pending', // default status
            });
        } catch (error) {
            console.error("Error adding task:", error);
            throw error;
        }
    };

    const updateTask = async (taskId, updates) => {
        if (!user) return;
        try {
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, updates);
        } catch (error) {
            console.error("Error updating task:", error);
            throw error;
        }
    };

    const deleteTask = async (taskId) => {
        if (!user) return;
        try {
            const taskRef = doc(db, 'tasks', taskId);
            await deleteDoc(taskRef);
        } catch (error) {
            console.error("Error deleting task:", error);
            throw error;
        }
    };

    const toggleTaskStatus = async (task) => {
        if (!user) return;

        // Logic for Recurrence
        if (task.status === 'pending' && task.recurrence && typeof task.recurrence === 'object' && task.recurrence.type !== 'none') {
            // It is a recurring task being marked as done
            // 1. Mark the current task as completed (preserve history)
            await updateTask(task.id, { status: 'completed' });

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
            await addDoc(collection(db, 'tasks'), {
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

            return;
        }

        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        await updateTask(task.id, { status: newStatus });
    };

    return {
        tasks,
        loading,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus
    };
}
