import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { ArrowLeft, Send, Sparkles, BarChart2, ArrowDown } from 'lucide-react-native';
import { useUserProfile } from '../../hooks/useUserProfile';
import { chatWithAI, summarizeConversation } from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNotifications } from '../../context/NotificationContext';
import { extractIntent } from '../../services/intentParser';
import { useTasks } from '../../hooks/useTasks';

const INITIAL_MESSAGE = (name) => ({
    id: 'initial_msg',
    text: `Hello, ${name || 'Friend'}! 👋 I'm Nova, your personal companion. I've been looking at your progress and I'm here to help you grow. What's on your mind today?`,
    isUser: false,
});

const isSimpleGreeting = (message) => {
    const normalized = (message || '').trim().toLowerCase().replace(/[!?.\s]+$/g, '');
    return /^(hi|hey|hello|yo|sup|heyy|hii|good morning|good afternoon|good evening)$/.test(normalized);
};

const isCreationRequest = (message) => {
    const normalized = (message || '').toLowerCase();
    const actionWords = /\b(create|add|make|build|plan|schedule|set|save|write)\b/;
    const targetWords = /\b(task|goal|roadmap|road map|reminder|diary|journal)\b/;
    return actionWords.test(normalized) && targetWords.test(normalized);
};

const getCreationContext = (message) => {
    const normalized = (message || '').toLowerCase();

    if (/\b(diary|journal)\b/.test(normalized)) {
        return 'The user is creating a diary entry. Stay in diary creation mode until the entry is saved or the user cancels. Gather the title, mood, and content, then confirm before saving.';
    }

    if (/\b(goal|goals)\b/.test(normalized)) {
        return 'The user is creating a goal. Stay in goal creation mode until the goal is saved or the user cancels. Gather the goal title and confirm before saving.';
    }

    if (/\b(roadmap|road map)\b/.test(normalized)) {
        return 'The user is creating a roadmap. Stay in roadmap creation mode until the roadmap is saved or the user cancels. Gather the goal, task list, due dates, recurrence choices, and reminder choices, then confirm before saving.';
    }

    return 'The user is creating a task. Stay in task creation mode until the task is saved or the user cancels. Gather the title, due date, recurrence choice, and reminder choice, then confirm before saving.';
};

const mayContainActionIntent = (message) => {
    const text = (message || '').toLowerCase();

    const patterns = [

        // English goals
        /\bi want to\b/,
        /\bi need to\b/,
        /\bi would like to\b/,
        /\bi'd like to\b/,
        /\bi plan to\b/,
        /\bi'm planning to\b/,
        /\bmy goal is\b/,
        /\bi hope to\b/,
        /\bi dream of\b/,
        /\bi wish to\b/,
        /\bi'm trying to\b/,
        /\bi am trying to\b/,

        // English tasks / habits
        /\bevery day\b/,
        /\bdaily\b/,
        /\bweekly\b/,
        /\bmonthly\b/,
        /\beach day\b/,
        /\beach week\b/,
        /\bremind me\b/,
        /\bremember to\b/,
        /\bi should\b/,
        /\bi must\b/,
        /\bi have to\b/,
        /\bhabit\b/,

        // Planning
        /\broadmap\b/,
        /\bplan\b/,
        /\bmilestone\b/,
        /\bobjective\b/,
        /\btarget\b/,
        /\bdeadline\b/,

        // Arabic
        /أريد/,
        /اريد/,
        /أحتاج/,
        /احتاج/,
        /هدفي/,
        /هدفي هو/,
        /أخطط/,
        /اخطط/,
        /كل يوم/,
        /يومياً/,
        /يوميًا/,
        /أذكرني/,
        /ذكرني/,

        // Hebrew
        /אני רוצה/,
        /אני צריך/,
        /אני צריכה/,
        /המטרה שלי/,
        /היעד שלי/,
        /אני מתכנן/,
        /אני מתכננת/,
        /כל יום/,
        /כל שבוע/,
        /תזכיר לי/,

        // Generic future intent
        /\btomorrow\b/,
        /\bnext week\b/,
        /\bnext month\b/,
        /\bnext year\b/
    ];

    return patterns.some(pattern => pattern.test(text));
};

export default function AIChat({ navigation, route }) {
    const { user } = useAuth();
    const { profile, loading: profileLoading, refreshProfile } = useUserProfile();
    const { showNotification } = useNotifications();
    const { addTask } = useTasks();
    const isFreshPlanningChat = route.params?.freshChat;
    const planningType = route.params?.planningType;
    console.log('freshChat=', route.params?.freshChat);
    console.log('planningType=', route.params?.planningType);
    // Silently synchronize AI profile when navigating to this tab
    useFocusEffect(
        useCallback(() => {
            refreshProfile(true);
        }, [refreshProfile])
    );


    useEffect(() => {

        if (!isFreshPlanningChat) return;

        const starterMessages = {
            task: "let's create a new task.",
            goal: "let's create a new goal.",
            roadmap: "let's create a new roadmap.",
            diary: "let's create a new diary."
        };

        const starterText =
            starterMessages[planningType] ||
            "I need some help.";

        setMessages([
            {
                id: 'planning_start',
                text: starterText,
                isUser: true
            }
        ]);

        chatHistoryRef.current = [
            {
                role: 'user',
                parts: [{ text: starterText }]
            }
        ];

        setLoadingHistory(false);

        sendMessage(starterText, null, true);

    }, []);

    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [memorySummary, setMemorySummary] = useState('');
    const [showScrollDown, setShowScrollDown] = useState(false);
    const messageCountSinceSummaryRef = useRef(0);
    // Chat history format for AI context
    const chatHistoryRef = useRef([]);
    const activePlanningContextRef = useRef('');
    const flatListRef = useRef(null);
    // Load initial history from Firestore
    useEffect(() => {
        if (isFreshPlanningChat) {
            setLoadingHistory(false);
            return;
        }
        if (!user || profileLoading || !profile) return;

        const loadHistory = async () => {
            try {
                const q = query(
                    collection(db, 'chat_messages'),
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                // Fetch long-term memory summary concurrently
                const [snapshot, memDoc] = await Promise.all([
                    getDocs(q),
                    getDoc(doc(db, 'user_memory', user.uid))
                ]);

                if (memDoc.exists()) {
                    setMemorySummary(memDoc.data().summary || "");
                }

                if (snapshot.empty) {
                    const initial = INITIAL_MESSAGE(profile.userName);
                    setMessages([initial]);
                    chatHistoryRef.current = [{
                        role: 'assistant',
                        parts: [{ text: initial.text }]
                    }];
                    // Optionally save initial greeting
                    addDoc(collection(db, 'chat_messages'), {
                        userId: user.uid,
                        text: initial.text,
                        isUser: false,
                        createdAt: serverTimestamp()
                    }).catch(console.error);
                } else {
                    const loadedMsgs = [];
                    const groqHist = [];
                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        loadedMsgs.unshift({ id: doc.id, text: data.text, isUser: data.isUser });
                        groqHist.unshift({
                            role: data.isUser ? 'user' : 'assistant',
                            parts: [{ text: data.text }]
                        });
                    });
                    setMessages(loadedMsgs);
                    chatHistoryRef.current = groqHist;
                }
            } catch (error) {
                console.error("Failed to load chat history:", error);
                setMessages([INITIAL_MESSAGE(profile.userName)]);
            } finally {
                setLoadingHistory(false);
            }
        };

        if (loadingHistory) {
            loadHistory();
        }
    }, [user, profile, profileLoading, loadingHistory]);

    // Initial scroll to bottom after loading
    useEffect(() => {
        if (!loadingHistory && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 200);
        }
    }, [loadingHistory, messages.length === 0]);


    const normalizeReminder = (reminder) => {
        if (!reminder || reminder.type === 'none' || !reminder.value) return null;
        return {
            type: reminder.type,
            value: reminder.value
        };
    };

    const normalizeRecurrence = (recurrence) => {
        if (!recurrence || recurrence.type === 'none') return null;
        return {
            type: recurrence.type,
            interval: Number(recurrence.interval) || 1
        };
    };

    const buildTaskPayload = (taskData, goalId = null) => ({
        title: (taskData.title || '').trim(),
        desc: taskData.desc || taskData.description || '',
        due: taskData.dueDate || taskData.due || '',
        priority: taskData.priority || 'Normal',
        status: 'pending',
        recurrence: normalizeRecurrence(taskData.recurrence),
        reminder: normalizeReminder(taskData.reminder),
        goalId
    });

    const hasCompleteTaskDetails = (taskData) => {
        if (!taskData?.title || !taskData?.dueDate) return false;
        if (taskData.recurrence && !taskData.recurrence.type) return false;
        if (taskData.reminder && !taskData.reminder.type) return false;

        return !taskData.reminder || taskData.reminder.type === 'none' || !!taskData.reminder.value;
    };

    const executeToolCall = async (toolCall) => {
        console.log('[AI_DEBUG][AIChat:executeToolCall:start]', toolCall);

        if (toolCall.action === 'create_goal') {

            await addDoc(collection(db, 'goals'), {
                userId: user.uid,
                title: toolCall.data.title,
                status: 'active',
                progress: 0,
                createdAt: serverTimestamp()
            });

            showNotification('success', `Goal "${toolCall.data.title}" is ready 🎯`);
        }

        else if (toolCall.action === 'create_task') {
            console.log('[AI_DEBUG][AIChat:create_task:data]', toolCall.data);

            if (!hasCompleteTaskDetails(toolCall.data)) {
                console.error('[AI_DEBUG][AIChat:create_task:incomplete]', toolCall.data);
                throw new Error('Incomplete task requirements');
            }

            let targetGoalId = null;

            if (toolCall.targetGoal) {

                const goalsQuery = query(
                    collection(db, 'goals'),
                    where('userId', '==', user.uid),
                    where('title', '==', toolCall.targetGoal)
                );

                const goalsSnap = await getDocs(goalsQuery);

                if (!goalsSnap.empty) {
                    targetGoalId = goalsSnap.docs[0].id;
                }
            }

            const taskPayload = buildTaskPayload(toolCall.data, targetGoalId);
            console.log('[AI_DEBUG][AIChat:create_task:payload]', taskPayload);
            await addTask(taskPayload);
            console.log('[AI_DEBUG][AIChat:create_task:saved]');

            showNotification('success', `Task "${toolCall.data.title}" added ✅`);
        }

        else if (toolCall.action === 'create_roadmap') {

            if (!toolCall.goalTitle || !Array.isArray(toolCall.tasks) || toolCall.tasks.length === 0) {
                throw new Error('Incomplete roadmap requirements');
            }

            const incompleteTask = (toolCall.tasks || []).find(task => !hasCompleteTaskDetails(task));
            if (incompleteTask) {
                throw new Error('Incomplete roadmap task requirements');
            }

            const newGoalRef = await addDoc(collection(db, 'goals'), {
                userId: user.uid,
                title: toolCall.goalTitle,
                status: 'active',
                progress: 0,
                createdAt: serverTimestamp()
            });

            const taskPromises = (toolCall.tasks || []).map(task =>
                addTask(buildTaskPayload(task, newGoalRef.id))
            );

            await Promise.all(taskPromises);

            showNotification(
                'encouragement',
                `Your plan "${toolCall.goalTitle}" is set 🚀`
            );
        }

        else if (toolCall.action === 'create_diary') {

            await addDoc(collection(db, 'diary_entries'), {
                userId: user.uid,
                title: toolCall.data.title || 'My Day',
                mood: toolCall.mood || 'good',
                content: toolCall.content,
                createdAt: serverTimestamp()
            });

            showNotification('success', `Diary entry saved ✨`);
        }

        refreshProfile(true);
    };

    const sendMessage = async (text, hiddenContext = null, isSilent = false) => {
        if (!text || isAiTyping || !user) return;
        console.log('[AI_DEBUG][AIChat:sendMessage:start]', {
            text,
            isSilent,
            hasHiddenContext: !!hiddenContext,
            hasUser: !!user,
            isAiTyping,
            activePlanningContext: activePlanningContextRef.current
        });

        if (!isSilent) {
            const userMsg = { id: Date.now().toString(), text, isUser: true };
            setMessages(prev => [...prev, userMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

            addDoc(collection(db, 'chat_messages'), {
                userId: user.uid,
                text,
                isUser: true,
                createdAt: serverTimestamp()
            }).catch(e => console.log('Log message failed:', e));
        }

        setIsAiTyping(true);
        const hadPlanningContext = !!activePlanningContextRef.current;
        const startsCreationFlow = !hiddenContext && isCreationRequest(text) && !hadPlanningContext;
        const isRegularGreeting = isSimpleGreeting(text) && !hiddenContext;
        if (isRegularGreeting) {
            activePlanningContextRef.current = '';
        }

        if (hiddenContext) {
            activePlanningContextRef.current = hiddenContext;
        } else if (
            isCreationRequest(text) ||
            mayContainActionIntent(text)
        ) {
            activePlanningContextRef.current = getCreationContext(text);
        }

        const isFreshPlanningStart = !!hiddenContext;
        const shouldUsePlanningContext = !isRegularGreeting && (hiddenContext || activePlanningContextRef.current);
        const systemContextForRequest = shouldUsePlanningContext ? (hiddenContext || activePlanningContextRef.current) : null;
        const messageForHistory = { role: 'user', parts: [{ text }] };
        const requestHistory = isFreshPlanningStart || startsCreationFlow
            ? [messageForHistory]
            : [...chatHistoryRef.current, messageForHistory];
        console.log('[AI_DEBUG][AIChat:sendMessage:mode]', {
            hadPlanningContext,
            startsCreationFlow,
            isRegularGreeting,
            isFreshPlanningStart,
            shouldUsePlanningContext,
            hasSystemContextForRequest: !!systemContextForRequest,
            requestHistoryCount: requestHistory.length
        });

        if (!isSilent) {
            chatHistoryRef.current.push(messageForHistory);
        }

        try {
            const rawResponse = await chatWithAI(
                profile,
                requestHistory.slice(-25),
                text,
                memorySummary,
                systemContextForRequest
            );
            console.log('[AI_DEBUG][AIChat:sendMessage:rawResponse]', {
                type: typeof rawResponse,
                length: rawResponse?.length || 0,
                preview: typeof rawResponse === 'string' ? rawResponse.slice(0, 240) : rawResponse
            });

            let finalResponseText = rawResponse;
            const intent = extractIntent(rawResponse);
            console.log('[AI_DEBUG][AIChat:sendMessage:intent]', intent);

            if (intent && !isFreshPlanningStart && (systemContextForRequest || isCreationRequest(text))) {
                // Nova's prompt ensures she only emits JSON AFTER the user has already confirmed.
                // So we execute immediately — no second confirmation needed.
                try {
                    await executeToolCall(intent);
                    if (['create_task', 'create_roadmap', 'create_goal', 'create_diary'].includes(intent.action)) {
                        activePlanningContextRef.current = '';
                    }
                } catch (e) {
                    console.warn('[AI_DEBUG][AIChat:executeToolCall:error]', {
                        message: e?.message,
                        stack: e?.stack,
                        intent
                    });
                    showNotification('error', 'Something went wrong while creating that ⚠️');
                }

                // Strip the JSON block from the raw response to show only conversational text
                let cleanedText = rawResponse.replace(/\{[\s\S]*\}/g, '').trim();

                // If Nova included a friendly message alongside the JSON, use it.
                // Otherwise, provide a context-appropriate confirmation.
                if (cleanedText) {
                    finalResponseText = cleanedText;
                } else {
                    if (intent.action === 'create_diary') {
                        finalResponseText = "Your diary entry has been saved ✨";
                    } else if (intent.action === 'create_goal') {
                        finalResponseText = `Your goal "${intent.data?.title}" is all set! Let's make it happen 🎯`;
                    } else if (intent.action === 'create_task') {
                        finalResponseText = `Done! I've added "${intent.data?.title}" to your tasks ✅`;
                    } else if (intent.action === 'create_roadmap') {
                        finalResponseText = `Your "${intent.goalTitle}" roadmap is ready to go 🚀`;
                    } else {
                        finalResponseText = "All set! 👍";
                    }
                }
            }

            finalResponseText = finalResponseText
                .replace(/\[action:.*?\]/g, '')
                .replace(/\[title:.*?\]/g, '')
                .replace(/\[due:.*?\]/g, '')
                .replace(/\[reminder:.*?\]/g, '')
                .replace(/\[recurrence:.*?\]/g, '')
                .replace(/\[goal:.*?\]/g, '')
                .replace(/\[goalTitle:.*?\]/g, '')
                .replace(/\[mood:.*?\]/g, '')
                .trim();

            // ✅ Fallback if empty (important)
            if (!finalResponseText) {
                finalResponseText = "Got it 👍";
            }

            const aiMsg = {
                id: (Date.now() + 1).toString(),
                text: finalResponseText,
                isUser: false
            };

            // ✅ Slight delay = smoother UX
            setTimeout(() => {
                setMessages(prev => [...prev, aiMsg]);
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 50);

            // ✅ Save CLEAN message only
            chatHistoryRef.current.push({ role: 'assistant', parts: [{ text: finalResponseText }] });

            addDoc(collection(db, 'chat_messages'), {
                userId: user.uid,
                text: finalResponseText,
                isUser: false,
                createdAt: serverTimestamp()
            }).catch(e => console.log('Log message failed:', e));

            // ✅ Background summarization (unchanged)
            messageCountSinceSummaryRef.current += 1;
            if (messageCountSinceSummaryRef.current >= 6) {
                messageCountSinceSummaryRef.current = 0;

                const historyToSummarize = chatHistoryRef.current.slice(-20);

                setTimeout(async () => {
                    try {
                        const newSummary = await summarizeConversation(memorySummary, historyToSummarize);
                        setMemorySummary(newSummary);
                        await setDoc(
                            doc(db, 'user_memory', user.uid),
                            { summary: newSummary },
                            { merge: true }
                        );
                    } catch (err) {
                        console.error('Summarization failed:', err);
                    }
                }, 500);
            }

        } catch (e) {
            console.error('[AI_DEBUG][AIChat:sendMessage:error]', {
                message: e?.message,
                stack: e?.stack
            });
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "I'm having a moment of pause. Try again in a bit 🌟",
                isUser: false
            }]);
        } finally {
            setIsAiTyping(false);
        }
    };

    const handleSend = () => {
        const text = inputText.trim();
        if (text) {
            setInputText('');
            sendMessage(text);
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
            {!item.isUser && (
                <View style={styles.aiIcon}>
                    <Sparkles size={14} color="#fff" />
                </View>
            )}
            <Text style={[styles.messageText, item.isUser ? styles.userText : styles.aiText]}>
                {item.text}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Nova — AI Companion</Text>
                    <View style={styles.onlineDot} />
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AIInsights')} style={{ padding: 8 }}>
                    <BarChart2 size={22} color={Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.chatContent}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    scrollEventThrottle={16}
                    onScroll={(e) => {
                        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
                        setShowScrollDown(!isCloseToBottom && messages.length > 0);
                    }}
                    ListHeaderComponent={
                        (profileLoading || loadingHistory) ? (
                            <View style={{ paddingVertical: 20 }}>
                                <ActivityIndicator color={Theme.colors.primary} />
                                <Text style={{ textAlign: 'center', color: Theme.colors.textSecondary, marginTop: 8, fontSize: 13, fontFamily: Theme.typography.body }}>Reading your journey...</Text>
                            </View>
                        ) : null
                    }
                />

                {isAiTyping && (
                    <View style={styles.typingIndicator}>
                        <Sparkles size={14} color={Theme.colors.primary} />
                        <Text style={styles.typingText}>Nova is thinking...</Text>
                    </View>
                )}

                {showScrollDown && (
                    <TouchableOpacity
                        style={styles.scrollDownButton}
                        onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    >
                        <ArrowDown size={24} color="#fff" />
                    </TouchableOpacity>
                )}

                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask anything..."
                        placeholderTextColor={Theme.colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || isAiTyping) && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isAiTyping}
                    >
                        <Send size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
        backgroundColor: Theme.colors.surface,
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Theme.colors.success,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        fontSize: 16,
    },
    chatContent: { padding: Theme.spacing.lg, paddingBottom: 8 },
    bubble: {
        maxWidth: '82%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        borderBottomLeftRadius: 4,
    },
    aiIcon: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Theme.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        marginTop: 2,
    },
    messageText: { fontSize: 15, fontFamily: Theme.typography.body, lineHeight: 22 },
    userText: { color: '#fff' },
    aiText: { color: Theme.colors.textMain, flexShrink: 1 },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: 8,
        gap: 6,
    },
    typingText: {
        fontSize: 13,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        marginRight: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: { backgroundColor: Theme.colors.border },
    scrollDownButton: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        backgroundColor: Theme.colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
