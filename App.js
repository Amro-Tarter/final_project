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
import { NotificationProvider } from './context/NotificationContext';
import LoginScreen from './screens/login';
import SignUpScreen from './screens/SignUp';
import ForgotPassword from './screens/ForgotPassword';
import HomeScreen from './screens/Home';
import OnboardingScreen from './screens/onBoarding';

const Stack = createNativeStackNavigator();

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CheckSquare, Target, Book, User, LayoutDashboard, MessageCircleHeart } from 'lucide-react-native';
import { Theme } from './components/components';

// Tabs
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopColor: Theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: Theme.typography.body,
          fontSize: 10,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={require('./screens/Tasks/TaskList').default}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="AITab"
        component={require('./screens/AI/AIChat').default}
        options={{
          tabBarLabel: 'Companion',
          tabBarIcon: ({ color }) => <MessageCircleHeart size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="GoalsTab"
        component={require('./screens/Goals/GoalList').default}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="DiaryTab"
        component={require('./screens/Diary/DiaryTimeline').default}
        options={{
          tabBarLabel: 'Diary',
          tabBarIcon: ({ color }) => <Book size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={require('./screens/Profile/Profile').default}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
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
        <>
          {/* Main Tab Navigator */}
          <Stack.Screen name="MainTabs" component={MainTabs} />

          {/* Details & Forms (Sitting on top of tabs) */}
          <Stack.Screen name="TaskDetails" component={require('./screens/Tasks/TaskDetails').default} />
          <Stack.Screen name="TaskForm" component={require('./screens/Tasks/TaskForm').default} />

          <Stack.Screen name="GoalDetails" component={require('./screens/Goals/GoalDetails').default} />
          <Stack.Screen name="GoalForm" component={require('./screens/Goals/GoalForm').default} />

          <Stack.Screen name="DiaryEntry" component={require('./screens/Diary/DiaryEntry').default} />
          <Stack.Screen name="DiaryForm" component={require('./screens/Diary/DiaryForm').default} />

          <Stack.Screen name="AIChat" component={require('./screens/AI/AIChat').default} />
          <Stack.Screen name="AIInsights" component={require('./screens/AI/AIInsights').default} />

          <Stack.Screen name="Settings" component={require('./screens/Profile/Settings').default} />
          <Stack.Screen name="AnalyticsDashboard" component={require('./screens/Analytics/AnalyticsDashboard').default} />
        </>
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
        <NotificationProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </AuthProvider>
    </View>
  );
}