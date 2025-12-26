import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Theme,
  LogoHeader,
  MyButton,
  MyCheckbox,
} from "../components/components"; // adjust path if needed

const QUESTIONS = [
  {
    key: "reason",
    title: "Why are you using this app?",
    subtitle: "Choose the main reason",
    type: "single",
    options: [
      "Improve my productivity",
      "Build better habits",
      "Achieve personal goals",
      "Get organized",
    ],
  },
  {
    key: "development",
    title: "What do you want to develop?",
    subtitle: "You can choose more than one",
    type: "multi",
    options: [
      "Discipline",
      "Focus",
      "Confidence",
      "Time management",
      "Consistency",
    ],
  },
  {
    key: "obstacles",
    title: "What obstacles do you face?",
    subtitle: "Select all that apply",
    type: "multi",
    options: [
      "Lack of motivation",
      "Procrastination",
      "Stress",
      "Poor planning",
      "Low energy",
    ],
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    reason: null,
    development: [],
    obstacles: [],
  });

  const current = QUESTIONS[step];

  const handleSingleSelect = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [current.key]: value,
    }));
    setStep(step + 1);
  };

  const handleMultiToggle = (value) => {
    setAnswers((prev) => {
      const list = prev[current.key];
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
      console.log("Onboarding completed:", answers);
      // TODO: Save to backend / context / AsyncStorage
    }
  };

  return (
    <View style={styles.container}>
      <LogoHeader
        title={current.title}
        subtitle={current.subtitle}
      />

      <View style={styles.options}>
        {current.type === "single" &&
          current.options.map((option) => (
            <MyButton
              key={option}
              title={option}
              style={styles.optionBtn}
              onPress={() => handleSingleSelect(option)}
            />
          ))}

        {current.type === "multi" &&
          current.options.map((option) => (
            <MyCheckbox
              key={option}
              label={option}
              checked={answers[current.key].includes(option)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.lg,
    justifyContent: "center",
  },
  options: {
    marginTop: Theme.spacing.xl,
  },
  optionBtn: {
    marginBottom: Theme.spacing.md,
  },
  nextBtn: {
    marginTop: Theme.spacing.xl,
  },
});
