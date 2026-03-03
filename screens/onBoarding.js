import React, { useState } from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
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

const QUESTIONS = [
  {
    key: "identity_vision",
    title: "If you had a 'perfect' productive day tomorrow, how would you feel at the end of it?",
    subtitle: "Focusing on the feeling helps us set the right pace for you.",
    type: "single",
    options: [
      "Peaceful and calm—I finally have things under control.",
      "Energized and proud—I smashed my big targets!",
      "Relieved—I finally stopped putting things off.",
      "Connected—I did my work and still had time for loved ones."
    ],
  },
  {
    key: "locus_of_control",
    title: "When things don't go as planned, what is your first thought?",
    subtitle: "This helps us tailor your daily encouragement.",
    type: "single",
    options: [
      " 'I need a better plan next time' (I'm in the driver's seat)",
      " 'Life just got in the way again' (The world is moving too fast)",
      " 'I'm just not disciplined enough' (I'm my own worst critic)",
      " 'I'll just try harder tomorrow' (I'm ready to keep going)"
    ],
  },
  {
    key: "future_self_identity",
    title: "When you imagine yourself a year from now, what feels most important?",
    subtitle: "Think about the version of you that you’d feel proud of.",
    type: "single",
    options: [
      "Being more consistent and reliable",
      "Feeling calmer and less stressed",
      "Making real progress toward my goals",
      "Understanding myself better",
      "I’m still figuring that out"
    ]
  },
  {
    key: "cbt_friction",
    title: "What usually 'steals' your focus during the day?",
    subtitle: "We all have focus-thieves; let's find yours. Select all that apply.",
    type: "multi",
    options: [
      "The 'I'll do it later' voice (Procrastination)",
      "Feeling overwhelmed by a giant to-do list (Analysis Paralysis)",
      "Wait, what was I doing? (Distractions & Notifications)",
      "Thinking it has to be 100% perfect or it's a failure (Perfectionism)",
      "Simply feeling too tired to start (Energy management)"
    ],
  },
  {
    key: "motivation_fuel",
    title: "What helps you keep going when motivation drops?",
    subtitle: "Different people need different kinds of fuel.",
    type: "multi",
    options: [
      "Encouraging words and reminders",
      "Seeing clear progress and numbers",
      "Small wins and quick feedback",
      "Understanding the deeper reason behind the goal",
      "Reminders of *why* I started this journey in the first place"
    ]
  },
];

export default function OnboardingScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [isStarted, setIsStarted] = useState(false);
  const [step, setStep] = useState(0);

  const [answers, setAnswers] = useState({
    identity_vision: null,
    locus_of_control: null,
    future_self_identity: null,
    cbt_friction: [],
    motivation_fuel: [],
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
    }
  };

  if (!isStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <LogoHeader
            title="Welcome to Achievements Ahead"
            subtitle="Let's build your personalized path to success."
            style={{ marginTop: Theme.spacing.xxl }}
          />
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeText}>
              To give you the best experience, we’re going to ask a few quick questions about your goals and habits.
            </Text>
            <Text style={styles.welcomeText}>
              This helps us tailor the app specifically for you.
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LogoHeader
          title={current.title}
          subtitle={current.subtitle}
          style={{ marginTop: Theme.spacing.lg }}
        />

        <View style={styles.options}>
          {current.type === "single" && current.options.map((option) => (
            <MyButton
              key={option}
              title={option}
              type="secondary" // Use secondary for options to look cleaner
              style={[
                styles.optionBtn,
                answers[current.key] === option && styles.optionBtnSelected
              ]}
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
        </View>

        {current.type === "multi" && (
          <MyButton
            title={step === QUESTIONS.length - 1 ? "Finish" : "Next"}
            onPress={handleNext}
            style={styles.nextBtn}
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
    backgroundColor: "#EFF6FF"
  },
  nextBtn: {
    marginTop: Theme.spacing.xl
  },
});