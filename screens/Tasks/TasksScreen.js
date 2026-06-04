import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentTabs } from '../../components/ui/SegmentTabs';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import TaskList from './TaskList';
import HabitScreen from '../Habits/HabitScreen';
import { ArrowLeft } from 'lucide-react-native';

export default function TasksScreen({ navigation, route }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    
    // Check if we were instructed to go directly to Habits tab (e.g. from Home screen "Habit Streaks" See All)
    const initialTab = route?.params?.initialTab || 0;
    const [tabIndex, setTabIndex] = useState(initialTab);

    // Translation keys could be 'tasks' and 'habits', falling back to defaults
    const tabs = [t('tasks') || 'Tasks', t('habitsTab') || 'Habits'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Minimal Header with Segment Tabs */}
            <View style={styles.header}>
                <SegmentTabs 
                    tabs={tabs} 
                    activeTab={tabs[tabIndex]} 
                    onTabChange={(selected) => setTabIndex(tabs.indexOf(selected))} 
                />
            </View>

            {/* Content Area */}
            <View style={styles.content}>
                {tabIndex === 0 ? (
                    <TaskList navigation={navigation} embedded={true} />
                ) : (
                    <HabitScreen navigation={navigation} embedded={true} />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        zIndex: 10,
    },
    content: {
        flex: 1,
    }
});
