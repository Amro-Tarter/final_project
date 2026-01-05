import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { MessageCircleHeart, CheckCircle2 } from 'lucide-react-native';
import { Theme } from '../components/components';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));

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
          <Text style={styles.greetingText}>Hello, {user?.email?.split('@')[0] || 'Friend'}.</Text>
          <Text style={styles.subGreeting}>Take a breath. You're doing great.</Text>
        </Animated.View>

        {/* 2. AI Companion Card (Support) */}
        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => navigation.navigate('AIChat')}
          activeOpacity={0.95}
        >
          <View style={styles.aiHeader}>
            <MessageCircleHeart size={28} color={Theme.colors.primary} />
            <Text style={styles.aiTitle}>Your Companion</Text>
          </View>
          <Text style={styles.aiMessage}>
            "I'm here to support you. No pressure today—just progress at your own pace."
          </Text>
          <View style={styles.aiPromptContainer}>
            <Text style={styles.aiPrompt}>Tap to chat</Text>
          </View>
        </TouchableOpacity>

        {/* 3. Today's Focus (Gentle Steps) */}
        <View style={styles.focusSection}>
          <Text style={styles.sectionTitle}>One Thing for Today</Text>
          <TouchableOpacity
            style={styles.focusCard}
            onPress={() => navigation.navigate('TaskDetails', { taskId: '1' })}
          >
            <View style={styles.focusIcon}>
              <CheckCircle2 size={24} color={Theme.colors.textSecondary} />
            </View>
            <View style={styles.focusContent}>
              <Text style={styles.focusText}>Drink water first thing</Text>
              <Text style={styles.focusSubtext}>Small steps matter.</Text>
            </View>
          </TouchableOpacity>
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

  // AI Card (Soft & Prominent)
  aiCard: {
    backgroundColor: "#F5F3FF", // Very light indigo
    borderRadius: 24,
    padding: 32,
    marginBottom: 48,
    borderWidth: 1,
    borderColor: "#DDD6FE", // Indigo 200
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 18,
    fontFamily: Theme.typography.subHeader,
    color: Theme.colors.primary,
    marginLeft: 10,
  },
  aiMessage: {
    fontSize: 18,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textMain,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 24,
  },
  aiPromptContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  aiPrompt: {
    color: Theme.colors.primary,
    fontFamily: Theme.typography.subHeader,
    fontSize: 14,
  },

  // Focus Section
  focusSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Theme.typography.subHeader,
    color: Theme.colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  focusIcon: {
    marginRight: 16,
  },
  focusContent: {
    flex: 1,
  },
  focusText: {
    fontSize: 18,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textMain,
    marginBottom: 4,
  },
  focusSubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});