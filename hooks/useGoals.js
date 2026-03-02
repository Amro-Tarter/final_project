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

export function useGoals() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

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
        if (!user) return;
        try {
            await addDoc(collection(db, 'goals'), {
                ...goalData,
                userId: user.uid,
                createdAt: serverTimestamp(),
                status: 'active', // active, completed
                progress: 0
            });
        } catch (error) {
            console.error("Error adding goal:", error);
            throw error;
        }
    };

    const updateGoal = async (goalId, updates) => {
        if (!user) return;
        try {
            const goalRef = doc(db, 'goals', goalId);
            await updateDoc(goalRef, updates);
        } catch (error) {
            console.error("Error updating goal:", error);
            throw error;
        }
    };

    const deleteGoal = async (goalId) => {
        if (!user) return;
        try {
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
