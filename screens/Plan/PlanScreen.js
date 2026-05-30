import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { SegmentTabs } from '../../components/ui/SegmentTabs';
import TaskList from '../Tasks/TaskList';
import CalendarScreen from '../Calendar/CalendarScreen';

export default function PlanScreen({ navigation }) {
    const [tab, setTab] = useState('Steps');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <SegmentTabs tabs={['Steps', 'Calendar']} activeTab={tab} onTabChange={setTab} />
            <View style={styles.content}>
                {tab === 'Steps' ? (
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
