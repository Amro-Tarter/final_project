import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { SegmentTabs } from '../../components/ui/SegmentTabs';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import TaskList from '../Tasks/TaskList';
import CalendarScreen from '../Calendar/CalendarScreen';

export default function PlanScreen({ navigation }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const [tabIndex, setTabIndex] = useState(0);
    const tabs = [t('nextSteps'), t('calendar')];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <SegmentTabs tabs={tabs} activeTab={tabs[tabIndex]} onTabChange={(selected) => setTabIndex(tabs.indexOf(selected))} />
            <View style={styles.content}>
                {tabIndex === 0 ? (
                    <TaskList navigation={navigation} embedded />
                ) : (
                    <CalendarScreen navigation={navigation} embedded />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    content: {
        flex: 1,
    },
});
