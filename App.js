import React from 'react';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Keep this
import { AuthProvider, useAuth } from './context/AuthContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// import "./globals.css";

import LoginScreen from './screens/login';
import SignUpScreen from './screens/SignUp';
import ForgotPassword from './screens/ForgotPassword';
import HomeScreen from './screens/Home';
import OnboardingScreen from './screens/onBoarding';


// ADD THIS LINE to initialize the Stack
const Stack = createNativeStackNavigator();



function RootNavigator() {
  const { user } = useAuth();

  return (
    // This will now work because Stack is defined by createNativeStackNavigator()
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


export default function App() {
 /*
 const [fontsLoaded] = useFonts({
    'Montserrat-Italic': require('./assets/fonts/Montserrat-Italic-VariableFont_wght.ttf'),
    'Montserrat': require('./assets/fonts/Montserrat-VariableFont_wght.ttf'),
    'Dosis-Regular': require('./assets/fonts/Dosis-VariableFont_wght.ttf'),
    'Dosis-SemiBold': require('./assets/fonts/Dosis-VariableFont_wght.ttf'),
    'Dosis-Bold': require('./assets/fonts/Dosis-VariableFont_wght.ttf'),
    });

  // --- ADD THIS SECTION ---r
  useEffect(() => {
    async function hideSplash() {
      if (fontsLoaded) {
        // This tells the splash screen to go away so the app can be seen
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [fontsLoaded]);
  // ------------------------

  if (!fontsLoaded) return null;
*/
  return (
    <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
    </AuthProvider>
  );
}