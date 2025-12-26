import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import {  signOut } from 'firebase/auth';
import { app } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react-native'; // Optional icons
import { auth } from '../config/firebase';

export default function HomeScreen() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Sign Out Error:", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Profile Avatar Placeholder */}
        <View style={styles.avatarContainer}>
          <UserIcon size={40} color="#6366f1" />
        </View>

        <Text style={styles.welcomeText}>
          Welcome, 
          <Text style={styles.emailText}> {user?.email || 'User'}!</Text>
        </Text>
        
        <Text style={styles.subtitle}>
          You are successfully logged in to your dashboard.
        </Text>
        
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  emailText: {
    color: '#4f46e5', // Indigo-600
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 40,
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#dc2626', // Red-600
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});