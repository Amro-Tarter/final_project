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
import { useNotifications } from '../context/NotificationContext';

export function useGoals() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { scheduleSystemNotification, cancelSystemNotification } = useNotifications();

    useEffect(() => {
        if (!user) {
            setGoals([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'goals'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const goalsData = [];
            querySnapshot.forEach((doc) => {
                goalsData.push({ id: doc.id, ...doc.data() });
            });
            setGoals(goalsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching goals:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addGoal = async (goalData) => {
        if (!user) {
            throw new Error('User is not authenticated');
        }

        try {
            let notificationId = null;
            if (goalData.deadline) {
                const deadlineDate = new Date(goalData.deadline);
                const reminderDate = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
                reminderDate.setHours(9, 0, 0, 0); // At 9 AM

                if (reminderDate > new Date()) {
                    notificationId = await scheduleSystemNotification(
                        null,
                        "Goal Deadline Approaching 🎯",
                        `Your goal "${goalData.title}" is due tomorrow! You've got this.`,
                        reminderDate,
                        'goal'
                    );
                }
            }

            const docRef = await addDoc(collection(db, 'goals'), {
                ...goalData,
                userId: user.uid,
                createdAt: serverTimestamp(),
                status: 'active',
                progress: 0,
                notificationId
            });
            return {
                id: docRef.id,
                ...goalData,
                notificationId
            };

        } catch (error) {
            throw error;
        }
    };

    const updateGoal = async (goalId, updates) => {
        if (!user) return;
        try {
            const goalRef = doc(db, 'goals', goalId);
            const goalToUpdate = goals.find(g => g.id === goalId);

            if (updates.deadline !== undefined || updates.title !== undefined) {
                if (goalToUpdate && goalToUpdate.notificationId) {
                    await cancelSystemNotification(goalToUpdate.notificationId);
                    updates.notificationId = null;
                }

                const finalDeadline = updates.deadline !== undefined ? updates.deadline : goalToUpdate?.deadline;
                const finalTitle = updates.title !== undefined ? updates.title : goalToUpdate?.title;

                if (finalDeadline) {
                    const deadlineDate = new Date(finalDeadline);
                    const reminderDate = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000);
                    reminderDate.setHours(9, 0, 0, 0);

                    if (reminderDate > new Date()) {
                        updates.notificationId = await scheduleSystemNotification(
                            null,
                            "Goal Deadline Approaching 🎯",
                            `Your goal "${finalTitle}" is due tomorrow! You've got this.`,
                            reminderDate,
                            'goal'
                        );
                    }
                }
            }

            await updateDoc(goalRef, updates);
        } catch (error) {
            console.error("Error updating goal:", error);
            throw error;
        }
    };

    const deleteGoal = async (goalId) => {
        if (!user) return;
        try {
            const goalToDelete = goals.find(g => g.id === goalId);
            if (goalToDelete && goalToDelete.notificationId) {
                await cancelSystemNotification(goalToDelete.notificationId);
            }

            // First query all tasks associated with this goal to remove the connection
            const tasksQuery = query(collection(db, 'tasks'), where('goalId', '==', goalId));
            const tasksSnapshot = await getDocs(tasksQuery);

            // Unlink tasks
            const updatePromises = tasksSnapshot.docs.map(taskDoc =>
                updateDoc(doc(db, 'tasks', taskDoc.id), { goalId: null })
            );
            await Promise.all(updatePromises);

            // Delete the goal itself
            const goalRef = doc(db, 'goals', goalId);
            await deleteDoc(goalRef);
        } catch (error) {
            console.error("Error deleting goal:", error);
            throw error;
        }
    };

    return {
        goals,
        loading,
        addGoal,
        updateGoal,
        deleteGoal
    };
}
