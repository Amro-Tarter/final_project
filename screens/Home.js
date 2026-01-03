import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { app } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Map, MessageCircleHeart, CheckCircle2 } from 'lucide-react-native';
import { auth } from '../config/firebase';
import { Theme, LogoHeader, MyButton } from '../components/components';

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Hello,</Text>
            <Text style={styles.userText}>{user?.email?.split('@')[0] || 'Traveler'}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <UserIcon size={24} color={Theme.colors.primary} />
          </View>
        </View>

        {/* AI Agent / Companion Card */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <MessageCircleHeart size={24} color={Theme.colors.primary} />
            <Text style={styles.aiTitle}>Your Companion</Text>
          </View>
          <Text style={styles.aiMessage}>
            "You’ve made great progress this week. Should we look at your next milestone together?"
          </Text>
          <TouchableOpacity style={styles.aiAction}>
            <Text style={styles.aiActionText}>Review Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Goal Manager / Current Path */}
        <Text style={styles.sectionTitle}>Your Journey</Text>
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Map size={24} color={Theme.colors.textSecondary} />
            <Text style={styles.goalTitle}>Current Destination</Text>
          </View>
          <Text style={styles.goalName}>Build a Consistent Morning Routine</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '35%' }]} />
          </View>
          <Text style={styles.progressText}>35% of the way there • Small steps verify big changes</Text>
        </View>

        <View style={styles.todayCard}>
          <Text style={styles.sectionTitleSmall}>Today's Focus</Text>
          <View style={styles.taskRow}>
            <CheckCircle2 size={20} color={Theme.colors.textSecondary} />
            <Text style={styles.taskText}>Drink water first thing</Text>
          </View>
          <View style={styles.taskRow}>
            <CheckCircle2 size={20} color={Theme.colors.primary} />
            <Text style={[styles.taskText, styles.taskCompleted]}>5 min meditation</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={Theme.colors.error} style={{ marginRight: 10 }} />
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  greetingText: {
    fontSize: 16,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  userText: {
    fontSize: 24,
    fontFamily: Theme.typography.header,
    color: Theme.colors.textMain,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#E0E7FF"
  },

  // AI Card
  aiCard: {
    backgroundColor: "#F5F3FF", // Very light indigo/lavender
    borderRadius: Theme.radius,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: "#DDD6FE", // Indigo 200
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.subHeader,
    color: Theme.colors.primary,
    marginLeft: 10,
  },
  aiMessage: {
    fontSize: 16,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textMain,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  aiAction: {
    alignSelf: 'flex-start',
  },
  aiActionText: {
    color: Theme.colors.primary,
    fontFamily: Theme.typography.subHeader,
    fontSize: 14,
  },

  // Goals
  sectionTitle: {
    fontSize: 20,
    fontFamily: Theme.typography.header,
    color: Theme.colors.textMain,
    marginBottom: Theme.spacing.md,
  },
  sectionTitleSmall: {
    fontSize: 16,
    fontFamily: Theme.typography.subHeader,
    color: Theme.colors.textMain,
    marginBottom: Theme.spacing.md,
  },
  goalCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontFamily: Theme.typography.subHeader,
    color: Theme.colors.textSecondary,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalName: {
    fontSize: 18,
    fontFamily: Theme.typography.header,
    color: Theme.colors.textMain,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textSecondary,
  },

  // Today
  todayCard: {
    marginBottom: Theme.spacing.xxl,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  taskText: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textMain,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: Theme.colors.textSecondary,
  },

  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: "#FEF2F2", // Light red bg
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  buttonText: {
    color: Theme.colors.error,
    fontSize: 16,
    fontFamily: Theme.typography.subHeader,
  },
});