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
    getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function useDiary() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setEntries([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'diary_entries'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const entriesData = [];
            querySnapshot.forEach((doc) => {
                entriesData.push({ id: doc.id, ...doc.data() });
            });
            setEntries(entriesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching diary entries:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addEntry = async (entryData) => {
        if (!user) throw new Error('User is not authenticated');

        try {
            const docRef = await addDoc(collection(db, 'diary_entries'), {
                ...entryData,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            return { id: docRef.id, ...entryData };
        } catch (error) {
            console.error("Error adding diary entry:", error);
            throw error;
        }
    };

    const updateEntry = async (entryId, updates) => {
        if (!user) return;
        try {
            const entryRef = doc(db, 'diary_entries', entryId);
            await updateDoc(entryRef, updates);
        } catch (error) {
            console.error("Error updating diary entry:", error);
            throw error;
        }
    };

    const deleteEntry = async (entryId) => {
        if (!user) return;
        try {
            const entryRef = doc(db, 'diary_entries', entryId);
            await deleteDoc(entryRef);
        } catch (error) {
            console.error("Error deleting diary entry:", error);
            throw error;
        }
    };

    const getEntryById = async (entryId) => {
        if (!user) return null;
        try {
            const entryRef = doc(db, 'diary_entries', entryId);
            const docSnap = await getDoc(entryRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting diary entry:", error);
            throw error;
        }
    }


    return {
        entries,
        loading,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntryById
    };
}
