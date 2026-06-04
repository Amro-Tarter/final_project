import React, { useCallback } from 'react';
import { View, Platform } from 'react-native';
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
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AppThemeProvider } from './context/ThemeContext';
import LoginScreen from './screens/login';
import SignUpScreen from './screens/SignUp';
import ForgotPassword from './screens/ForgotPassword';
import WelcomeScreen from './screens/Welcome';
import HomeScreen from './screens/Home';
import OnboardingScreen from './screens/onBoarding';

const Stack = createNativeStackNavigator();

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Compass, BookHeart, UserCircle, Map, Repeat, CheckCircle2 } from 'lucide-react-native';
import { Theme } from './components/components';
import { JourneyCopy } from './constants/JourneyCopy';

import { useAppTheme } from './context/ThemeContext';

const Tab = createBottomTabNavigator();

function MainTabs() {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 10,
          elevation: 0,
          shadowColor: '#64748B',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: Theme.typography.body,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t('homeTab'),
          tabBarIcon: ({ color }) => <Compass size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="GoalsTab"
        component={require('./screens/Goals/GoalList').default}
        options={{
          tabBarLabel: t('goalsTab'),
          tabBarIcon: ({ color }) => <Map size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={require('./screens/Tasks/TasksScreen').default}
        options={{
          tabBarLabel: t('tasks') || 'Tasks',
          tabBarIcon: ({ color }) => <CheckCircle2 size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="ReflectTab"
        component={require('./screens/Reflect/ReflectScreen').default}
        options={{
          tabBarLabel: t('diaryTab'),
          tabBarIcon: ({ color }) => <BookHeart size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={require('./screens/Reflect/Profile/Profile').default}
        options={{
          tabBarLabel: t('me'),
          tabBarIcon: ({ color }) => <UserCircle size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        user.onboardingComplete ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />

            <Stack.Screen name="TaskList" component={require('./screens/Tasks/TaskList').default} />
            <Stack.Screen name="TaskDetails" component={require('./screens/Tasks/TaskDetails').default} />
            <Stack.Screen name="TaskForm" component={require('./screens/Tasks/TaskForm').default} />

            <Stack.Screen name="GoalDetails" component={require('./screens/Goals/GoalDetails').default} />
            <Stack.Screen name="GoalForm" component={require('./screens/Goals/GoalForm').default} />

            <Stack.Screen name="HabitDetails" component={require('./screens/Habits/HabitDetails').default} />
            <Stack.Screen name="HabitForm" component={require('./screens/Habits/HabitForm').default} />

            <Stack.Screen name="DiaryEntry" component={require('./screens/Diary/DiaryEntry').default} />
            <Stack.Screen name="DiaryForm" component={require('./screens/Diary/DiaryForm').default} />

            <Stack.Screen name="AIChat" component={require('./screens/AI/AIChat').default} />

            <Stack.Screen name="Settings" component={require('./screens/Reflect/Profile/Settings').default} />
            <Stack.Screen name="CelebrationWall" component={require('./screens/Celebration/CelebrationWall').default} />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </>
      )}
    </Stack.Navigator>
  );
}

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
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </AppThemeProvider>
    </View>
  );
}
