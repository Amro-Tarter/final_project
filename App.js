import React, { useCallback } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold
} from '@expo-google-fonts/inter';
import {
  Poppins_500Medium,
  Poppins_600SemiBold
} from '@expo-google-fonts/poppins';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/login';
import SignUpScreen from './screens/SignUp';
import ForgotPassword from './screens/ForgotPassword';
import HomeScreen from './screens/Home';
import OnboardingScreen from './screens/onBoarding';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Home" component={HomeScreen} />
      ) : (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </>
      )}
    </Stack.Navigator>
  );
}

// Keep the startup splash screen visible until we are ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      // This tells the splash screen to go away so the app can be seen
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </View>
  );
}