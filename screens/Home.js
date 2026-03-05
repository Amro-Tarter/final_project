import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Circle, Plus } from 'lucide-react-native';
import { Theme } from '../components/components';
import { useTasks } from '../hooks/useTasks';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { tasks, loading } = useTasks();
  const [fadeAnim] = useState(new Animated.Value(0));

  // Find the "One Thing" - First pending task, ideally High Priority
  const focusTask = tasks.find(t => t.status === 'pending' && t.priority === 'High')
    || tasks.find(t => t.status === 'pending');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 1. Warm Greeting (Emotional Orientation) */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.greetingText}>Hello, {user?.email?.split('@')[0] || 'Friend'}.</Text>
              <Text style={styles.subGreeting}>Take a breath. You're doing great.</Text>
            </View>
          </View>
        </Animated.View>

        {/* 2. Today's Journey (Full List) */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Your Journey Today</Text>

          {loading ? (
            <Text style={styles.subGreeting}>Loading path...</Text>
          ) : tasks.filter(t => t.status === 'pending').length > 0 ? (
            <View>
              {tasks.filter(t => t.status === 'pending').map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
                >
                  <View style={styles.taskIcon}>
                    {task.priority === 'High' ? (
                      <Circle size={24} color={Theme.colors.primary} />
                    ) : (
                      <Circle size={24} color={Theme.colors.textSecondary} />
                    )}
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.due && <Text style={styles.taskDue}>{task.due}</Text>}
                    {task.recurrence?.type !== 'none' && (
                      <Text style={styles.recurringTag}>↻ Repeats</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.taskCard, { borderStyle: 'dashed', justifyContent: 'center' }]}
              onPress={() => navigation.navigate('TaskForm')}
            >
              <Plus size={24} color={Theme.colors.primary} />
              <Text style={[styles.taskTitle, { marginLeft: 12, color: Theme.colors.primary }]}>
                Add a Stop to Your Journey
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flex: 1 }} />
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
    justifyContent: 'center',
  },
  header: {
    marginTop: 40,
    marginBottom: 48,
  },
  greetingText: {
    fontSize: 32,
    fontFamily: Theme.typography.header,
    color: Theme.colors.textMain,
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 18,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textSecondary,
  },

  // Task List Styles
  listSection: {
    marginBottom: 32,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  taskIcon: {
    marginRight: 16,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textMain,
    marginBottom: 4,
  },
  taskDue: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  recurringTag: {
    fontSize: 10,
    color: Theme.colors.primary,
    marginTop: 4,
    fontFamily: Theme.typography.subHeader,
  },
});