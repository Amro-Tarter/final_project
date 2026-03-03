import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { MyButton, MyInput, LogoHeader, Theme, MyCustomAlert } from "../components/components";

export default function SignUpScreen({ navigation, route }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      setAlertTitle("Missing Fields");
      setAlertMessage("Please fill in all details.");
      setAlertVisible(true);
      return;
    }
    if (password !== confirmPassword) {
      setAlertTitle("Password Mismatch");
      setAlertMessage("Passwords do not match!");
      setAlertVisible(true);
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        createdAt: serverTimestamp(),
        onboardingComplete: false
      });

    } catch (error) {
      setAlertTitle("Sign Up Failed");
      setAlertMessage(error.message);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LogoHeader
            title="Create Account"
            subtitle="Join us to start your journey"
            style={{ marginTop: Theme.spacing.xl }}
          />

          <View style={styles.form}>
            <MyInput
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              icon={User}
            />
            <MyInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={Mail}
            />
            <MyInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              icon={Lock}
              rightIcon={showPass ? EyeOff : Eye}
              onRightIconPress={() => setShowPass(!showPass)}
            />
            <MyInput
              label="Confirm Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPass}
              icon={Lock}
            />

            <MyButton
              title={loading ? "Creating Account..." : "Sign Up"}
              onPress={handleSignUp}
              disabled={loading}
              style={{ marginTop: Theme.spacing.lg }}
            />

            <View style={styles.footer}>
              <Text style={styles.grayText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkTextBold}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <MyCustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl
  },
  form: {
    width: "100%"
  },
  grayText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: Theme.typography.body
  },
  linkTextBold: {
    color: Theme.colors.primary,
    fontFamily: Theme.typography.header,
    fontSize: 16
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Theme.spacing.xl
  },
});