import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";

// Import components
import { MyButton, MyInput, MyCheckbox, LogoHeader, Theme, MyCustomAlert } from "../components/components";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        setAlertTitle("Missing Info");
        setAlertMessage("Please enter both email and password.");
        setAlertVisible(true);
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      // Logic for "Remember Me" could go here
    } catch (error) {
      setAlertTitle("Login Failed");
      setAlertMessage("The email or password you entered is incorrect.");
      setAlertVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <LogoHeader
            title="Welcome Back"
            subtitle="Sign in to continue your journey"
            style={{ marginTop: Theme.spacing.xl }}
          />

          <View style={styles.form}>
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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              icon={Lock}
              rightIcon={showPass ? EyeOff : Eye}
              onRightIconPress={() => setShowPass(!showPass)}
            />

            <View style={styles.rowBetween}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <MyCheckbox
                  label="Remember me"
                  checked={rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                />
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <MyButton
              title="Sign In"
              onPress={handleLogin}
              style={{ marginTop: Theme.spacing.lg }}
            />

            <View style={styles.footer}>
              <Text style={styles.grayText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkTextBold}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <MyCustomAlert
              visible={alertVisible}
              title={alertTitle}
              message={alertMessage}
              onClose={() => setAlertVisible(false)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  form: {
    width: "100%",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
    marginTop: Theme.spacing.sm
  },
  grayText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontFamily: Theme.typography.body,
  },
  linkText: {
    color: Theme.colors.primary,
    fontFamily: Theme.typography.bodyBold,
    fontSize: 14,
  },
  linkTextBold: {
    color: Theme.colors.primary,
    fontFamily: Theme.typography.header,
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Theme.spacing.xl,
  },
});