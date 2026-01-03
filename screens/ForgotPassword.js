import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft } from "lucide-react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import { MyButton, MyInput, LogoHeader, Theme, MyCustomAlert } from "../components/components";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const handleReset = async () => {
    if (!email) {
      setAlertTitle("Email Required");
      setAlertMessage("Please enter your email to receive a reset link.");
      setAlertVisible(true);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setAlertTitle("Email Sent");
      setAlertMessage("Check your inbox for the password reset link.");
      setAlertVisible(true);
    } catch (error) {
      setAlertTitle("Error");
      setAlertMessage(error.message);
      setAlertVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color={Theme.colors.textMain} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.content}>
          <LogoHeader
            title="Reset Password"
            subtitle="Enter your email and we'll send you a link to get back into your account."
            style={{ marginBottom: Theme.spacing.xl }}
            subtitleStyle={{ paddingHorizontal: Theme.spacing.md }}
          />

          <MyInput
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={Mail}
          />

          <MyButton
            title="Send Reset Link"
            onPress={handleReset}
            style={{ marginTop: Theme.spacing.xl }}
          />
        </View>
      </KeyboardAvoidingView>

      <MyCustomAlert
        visible={alertVisible} title={alertTitle} message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Theme.spacing.lg
  },
  backButton: {
    padding: Theme.spacing.lg,
    alignSelf: 'flex-start'
  }
});