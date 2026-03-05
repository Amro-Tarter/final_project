import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getRandomEncouragement } from '../constants/EncouragementLibrary';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Requests permissions for notifications
 */
export async function registerForPushNotificationsAsync() {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return null;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4F46E5',
        });
    }

    return finalStatus;
}

/**
 * Schedules a standard reminder for a task or goal
 * @param {string} id - Unique identifier (to allow cancellation)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Date} date - When to fire
 * @param {string} type - 'task' or 'goal'
 */
export async function scheduleFeatureReminder(id, title, body, date, type) {
    if (!(date instanceof Date) || isNaN(date)) return null;
    if (date <= new Date()) return null; // Can't schedule in the past

    const trigger = date;

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: { id, type },
            sound: true,
        },
        trigger: {
            type: 'date',
            date: trigger,
        },
    });

    return notificationId;
}

/**
 * Cancels a specific notification
 */
export async function cancelNotification(notificationId) {
    if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
}

/**
 * Randomly schedules AI encouragement messages for the next 48 hours
 * This is called whenever the app is opened to "refill" the queue.
 */
export async function scheduleAIRandomizedFeed() {
    // 1. Clear existing AI notifications to prevent duplicates/clutter
    const scheduledList = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduledList) {
        if (notification.content.data?.type === 'ai_encouragement') {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }

    // 2. Schedule 3-5 random notifications for the next 48 hours
    const numNotifications = Math.floor(Math.random() * 3) + 3; // 3 to 5

    for (let i = 0; i < numNotifications; i++) {
        // Pick a random time in the next 48 hours
        const now = new Date();
        const futureHours = Math.floor(Math.random() * 48) + 1;
        const triggerDate = new Date(now.getTime() + futureHours * 60 * 60 * 1000);

        // Ensure it's in a "socially acceptable" window (8 AM to 9 PM)
        const hour = triggerDate.getHours();
        if (hour < 8) triggerDate.setHours(8 + Math.floor(Math.random() * 3));
        if (hour > 21) triggerDate.setHours(9 + Math.floor(Math.random() * 3)); // Morning of next day basically

        // Get a random message
        const degree = Math.floor(Math.random() * 3) + 1; // Gentle to moderate encouragement
        const message = getRandomEncouragement(degree);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Achievements Ahead ✨",
                body: message,
                data: { type: 'ai_encouragement' },
            },
            trigger: {
                type: 'date',
                date: triggerDate,
            },
        });
    }

    console.log(`Scheduled ${numNotifications} randomized AI notifications.`);
}
