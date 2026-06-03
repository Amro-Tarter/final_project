import React, { useState } from "react";
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Theme,
  LogoHeader,
  MyButton,
  MyCheckbox,
} from "../components/components";
import { db } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";

const QUESTIONS = [
  {
    key: "coreProblem",
    title: "If you had to describe what your typical weekday feels like right now, what would you say?",
    subtitle: "There's no wrong answer, and this helps us calibrate the app.",
    type: "single",
    options: [
      "A blur. I'm constantly moving but getting nowhere.",
      "A rollercoaster. Some days I'm on fire, others I do nothing.",
      "A puzzle. I'm always trying to fit more pieces into 24 hours."
    ],
  },
  {
    key: "supportPreference",
    title: "When you get completely stuck, what helps you the most?",
    subtitle: "We all need different kinds of help when facing a wall.",
    type: "single",
    options: [
      "Someone telling me to stop whining and just figure it out.",
      "Someone reminding me how far I've already come.",
      "Someone just handing me the instruction manual."
    ],
  },
  {
    key: "overdueProtocol",
    title: "You find an old, unfinished to-do list. How do you react?",
    subtitle: "This sets how the app handles your overdue tasks.",
    type: "single",
    options: [
      "I feel guilty and rewrite it right away.",
      "I toss it out. Fresh start today.",
      "I wonder why I avoided it."
    ],
  },
  {
    key: "dailyExecutionTime",
    title: "When are you most likely to vanish into 'the zone' and get focused work done?",
    subtitle: "When is your peak focus time?",
    type: "single",
    options: [
      "Before the world wakes up (Early Morning)",
      "Right in the middle of the chaos (Mid-day)",
      "When everyone else goes to sleep (Late Night)"
    ],
  },
];

export default function OnboardingScreen({ navigation }) {
  const { colors } = useAppTheme();
  const { user, updateUser } = useAuth();
  const [isStarted, setIsStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [answers, setAnswers] = useState({
    coreProblem: null,
    supportPreference: null,
    overdueProtocol: null,
    dailyExecutionTime: null,
  });

  const current = QUESTIONS[step];

  const handleSingleSelect = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [current.key]: value,
    }));
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleMultiToggle = (value) => {
    setAnswers((prev) => {
      const list = prev[current.key] || [];
      return {
        ...prev,
        [current.key]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });
  };

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      if (user) {
        setIsSubmitting(true);
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          onboardingAnswers: answers,
          onboardingComplete: true
        });
        updateUser({ onboardingComplete: true });
        // Navigation handled automatically by App.js state change
      }
    } catch (error) {
      console.error("Error saving onboarding: ", error);
      setIsSubmitting(false);
    }
  };

  if (!isStarted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.contentContainer}>
          <LogoHeader
            title="Welcome, Traveler"
            subtitle="Let's map a journey that fits your pace."
            style={{ marginTop: Theme.spacing.xxl }}
          />
          <View style={styles.welcomeBox}>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
              A few gentle questions help Nova understand how you move through your days.
            </Text>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
              Your answers shape reminders, support style, and how we handle overdue steps.
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <MyButton
            title="Let's Begin"
            onPress={() => setIsStarted(true)}
            style={styles.nextBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LogoHeader
          title={current.title}
          subtitle={current.subtitle}
          style={{ marginTop: Theme.spacing.lg }}
        />

        <View style={styles.options}>
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Saving your profile...</Text>
            </View>
          ) : (
            <>
              {current.type === "single" && current.options.map((option) => (
                <MyButton
                  key={option}
                  title={option}
                  type="secondary"
                  style={[
                    styles.optionBtn,
                    answers[current.key] === option && [styles.optionBtnSelected, { borderColor: colors.primary, backgroundColor: colors.primaryLightAlt }]
                  ]}
                  disabled={isSubmitting}
                  onPress={() => handleSingleSelect(option)}
                />
              ))}

              {current.type === "multi" && current.options.map((option) => (
                <MyCheckbox
                  key={option}
                  label={option}
                  checked={answers[current.key]?.includes(option)}
                  onPress={() => handleMultiToggle(option)}
                />
              ))}
            </>
          )}
        </View>

        {current.type === "multi" && (
          <MyButton
            title={step === QUESTIONS.length - 1 ? (isSubmitting ? "Saving..." : "Finish") : "Next"}
            onPress={handleNext}
            style={styles.nextBtn}
            disabled={isSubmitting}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  contentContainer: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingBottom: 40
  },
  welcomeBox: {
    marginVertical: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.md
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
    lineHeight: 24
  },
  options: {
    marginTop: Theme.spacing.lg
  },
  optionBtn: {
    marginBottom: 12,
    alignItems: 'flex-start', // Left align text for long options
    paddingHorizontal: 20
  },
  optionBtnSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryLightAlt
  },
  nextBtn: {
    marginTop: Theme.spacing.xl
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: Theme.typography.subHeader,
    color: Theme.colors.textSecondary,
    fontSize: 16,
  }
});