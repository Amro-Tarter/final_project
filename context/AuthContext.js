import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  useEffect(() => {
    let isInitialLoad = true;
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (isInitialLoad) {
            const rem = await AsyncStorage.getItem('rememberMe');
            if (rem === 'false') {
                await signOut(auth);
                setUser(null);
                setLoading(false);
                isInitialLoad = false;
                return;
            }
        }
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser({ ...currentUser, ...userDoc.data() });
          } else {
            setUser(currentUser);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      isInitialLoad = false;
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
