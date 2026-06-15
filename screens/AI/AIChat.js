import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../components/components';
import { ArrowLeft, Send, Sparkles, BarChart2, ArrowDown, Menu, Plus, X, MessageSquare, Trash2 } from 'lucide-react-native';
import { useUserProfile } from '../../hooks/useUserProfile';
import { chatWithAI, summarizeConversation, generateChatTitle, updateGlobalKnowledge } from '../../services/aiService';
import { extractIntent } from '../../services/intentParser';
const { width } = Dimensions.get('window');
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNotifications } from '../../context/NotificationContext';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useGoals } from '../../hooks/useGoals';
import { useDiary } from '../../hooks/useDiary';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const INITIAL_MESSAGE = (name, t) => ({
    id: 'initial_msg',
    text: t ? t('homeGreeting') + `, ${name}! ` + t('aiGuideSubtitle') : `Hello, ${name || 'Friend'}! 👋 I'm Nova, your personal companion. I've been looking at your progress and I'm here to help you grow. What's on your mind today?`,
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

    if (/\b(habit|habits)\b/.test(normalized)) {
        return 'The user is creating a habit. Stay in habit creation mode until the habit is saved or the user cancels. Gather the habit title and frequency (daily/weekly), then confirm before saving.';
    }

    if (/\b(roadmap|road map)\b/.test(normalized)) {
        return 'The user is creating a roadmap. Stay in roadmap creation mode until the roadmap is saved or the user cancels. Gather the goal, task list, habit list, due dates, and reminders, then confirm before saving.';
    }

    return 'The user is creating a task. Stay in task creation mode until the task is saved or the user cancels. Gather the title, due date, and reminder choice, then confirm before saving.';
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
    const { colors } = useAppTheme();
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { profile, loading: profileLoading, refreshProfile } = useUserProfile();
    const { showNotification } = useNotifications();
    const { addTask, updateTask, deleteTask } = useTasks();
    const { addHabit, updateHabit, deleteHabit } = useHabits();
    const { updateGoal, deleteGoal } = useGoals();
    const { updateEntry, deleteEntry } = useDiary();
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

        setCurrentSessionId(null);
        setSessionSummary("");

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
    
    // NEW STATES
    const [globalKnowledge, setGlobalKnowledge] = useState('');
    const [sessionSummary, setSessionSummary] = useState('');
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [showScrollDown, setShowScrollDown] = useState(false);
    const messageCountSinceSummaryRef = useRef(0);
    // Chat history format for AI context
    const chatHistoryRef = useRef([]);
    const activePlanningContextRef = useRef('');
    const flatListRef = useRef(null);

    const currentSessionIdRef = useRef(currentSessionId);
    useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);
    const sessionSummaryRef = useRef(sessionSummary);
    useEffect(() => { sessionSummaryRef.current = sessionSummary; }, [sessionSummary]);

    // Migrate Legacy Chats
    useEffect(() => {
        if (!user) return;
        const migrateLegacyChats = async () => {
            try {
                const q = query(
                    collection(db, 'chat_messages'),
                    where('userId', '==', user.uid)
                );
                const snapshot = await getDocs(q);
                const legacyMessages = snapshot.docs.filter(d => !d.data().sessionId);
                
                if (legacyMessages.length === 0) return;

                const sessQ = query(
                    collection(db, 'chat_sessions'),
                    where('userId', '==', user.uid)
                );
                const sessSnap = await getDocs(sessQ);
                const legacySessionDoc = sessSnap.docs.find(d => d.data().title === 'Legacy Chat');
                
                let legacySessionId;
                if (!legacySessionDoc) {
                    const newRef = await addDoc(collection(db, 'chat_sessions'), {
                        userId: user.uid,
                        title: 'Legacy Chat',
                        topicSummary: 'Legacy chats from before the tabs update.',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    legacySessionId = newRef.id;
                } else {
                    legacySessionId = legacySessionDoc.id;
                }

                let batch = writeBatch(db);
                let count = 0;
                for (const docSnap of legacyMessages) {
                    batch.update(docSnap.ref, { sessionId: legacySessionId });
                    count++;
                    if (count >= 400) {
                        await batch.commit();
                        batch = writeBatch(db);
                        count = 0;
                    }
                }
                if (count > 0) await batch.commit();

                console.log('Legacy chats migrated successfully.');
                showNotification('success', 'Old chats restored to Legacy Chat tab.');
            } catch (error) {
                console.error('Migration failed:', error);
            }
        };
        migrateLegacyChats();
    }, [user]);

    // 1. Load Sessions and Global Knowledge
    useEffect(() => {
        if (!user) return;
        const loadSessions = async () => {
            try {
                const q = query(
                    collection(db, 'chat_sessions'),
                    where('userId', '==', user.uid),
                    orderBy('updatedAt', 'desc'),
                    limit(20)
                );
                
                const [snap, memDoc] = await Promise.all([
                    getDocs(q),
                    getDoc(doc(db, 'user_memory', user.uid))
                ]);

                if (memDoc.exists()) {
                    setGlobalKnowledge(memDoc.data().globalKnowledge || "");
                }

                const loadedSessions = [];
                snap.docs.forEach(d => loadedSessions.push({ id: d.id, ...d.data() }));
                setSessions(loadedSessions);

                if (isFreshPlanningChat) {
                    setCurrentSessionId(null);
                    setSessionSummary("");
                } else if (loadedSessions.length > 0) {
                    setCurrentSessionId(loadedSessions[0].id);
                    setSessionSummary(loadedSessions[0].topicSummary || "");
                } else {
                    setCurrentSessionId(null);
                    setSessionSummary("");
                }
            } catch (err) {
                console.error("Failed to load sessions:", err);
            }
        };
        loadSessions();
    }, [user, isFreshPlanningChat]);

    // 2. Load Messages when currentSessionId changes
    useEffect(() => {
        if (!user || profileLoading || !profile) return;
        
        if (!currentSessionId && !isFreshPlanningChat) {
            const initial = INITIAL_MESSAGE(profile.userName, t);
            setMessages([initial]);
            chatHistoryRef.current = [{
                role: 'assistant',
                parts: [{ text: initial.text }]
            }];
            setLoadingHistory(false);
            return;
        }

        if (isFreshPlanningChat && !currentSessionId) {
             return; 
        }

        setLoadingHistory(true);
        const loadMessages = async () => {
            try {
                const q = query(
                    collection(db, 'chat_messages'),
                    where('userId', '==', user.uid),
                    where('sessionId', '==', currentSessionId),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
                
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    const initial = INITIAL_MESSAGE(profile.userName, t);
                    setMessages([initial]);
                    chatHistoryRef.current = [{
                        role: 'assistant',
                        parts: [{ text: initial.text }]
                    }];
                } else {
                    const loadedMsgs = [];
                    const groqHist = [];
                    snapshot.docs.forEach(d => {
                        const data = d.data();
                        loadedMsgs.unshift({ id: d.id, text: data.text, isUser: data.isUser });
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
                setMessages([INITIAL_MESSAGE(profile.userName, t)]);
            } finally {
                setLoadingHistory(false);
            }
        };

        if (currentSessionId) {
            loadMessages();
        }
    }, [currentSessionId, user, profile, profileLoading]);

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

            const newGoalRef = await addDoc(collection(db, 'goals'), {
                userId: user.uid,
                title: toolCall.data.title,
                deadline: toolCall.data.deadline || toolCall.deadline || null,
                status: 'active',
                progress: 0,
                createdAt: serverTimestamp()
            });

            if (toolCall.data.tasks && toolCall.data.tasks.length > 0) {
                const taskPromises = toolCall.data.tasks.map(task =>
                    addTask(buildTaskPayload(task, newGoalRef.id))
                );
                await Promise.all(taskPromises);
            }

            if (toolCall.data.habits && toolCall.data.habits.length > 0) {
                const habitPromises = toolCall.data.habits.map(habit =>
                    addHabit({
                        title: habit.title.trim(),
                        frequency: habit.frequency || 'daily',
                        goalId: newGoalRef.id,
                        status: 'active'
                    })
                );
                await Promise.all(habitPromises);
            }

            showNotification('success', t('goalSaved'));
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

            showNotification('success', t('taskSaved'));
        }

        else if (toolCall.action === 'create_habit') {
            console.log('[AI_DEBUG][AIChat:create_habit:data]', toolCall.data);

            if (!toolCall.data?.title || !toolCall.data?.frequency) {
                console.error('[AI_DEBUG][AIChat:create_habit:incomplete]', toolCall.data);
                throw new Error('Incomplete habit requirements');
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

            const habitPayload = {
                title: toolCall.data.title.trim(),
                frequency: toolCall.data.frequency || 'daily',
                goalId: targetGoalId,
                status: 'active'
            };

            await addHabit(habitPayload);
            showNotification('success', t('habitSaved') || 'Habit created!');
        }

        else if (toolCall.action === 'create_roadmap') {

            const hasTasks = Array.isArray(toolCall.tasks) && toolCall.tasks.length > 0;
            const hasHabits = Array.isArray(toolCall.habits) && toolCall.habits.length > 0;

            if (!toolCall.goalTitle || (!hasTasks && !hasHabits)) {
                throw new Error('Incomplete roadmap requirements: needs tasks or habits');
            }

            if (hasTasks) {
                const incompleteTask = toolCall.tasks.find(task => !hasCompleteTaskDetails(task));
                if (incompleteTask) {
                    throw new Error('Incomplete roadmap task requirements');
                }
            }

            const newGoalRef = await addDoc(collection(db, 'goals'), {
                userId: user.uid,
                title: toolCall.goalTitle,
                deadline: toolCall.deadline || null,
                emoji: toolCall.emoji || '🎯',
                status: 'active',
                progress: 0,
                createdAt: serverTimestamp()
            });

            const taskPromises = (toolCall.tasks || []).map(task =>
                addTask(buildTaskPayload(task, newGoalRef.id))
            );

            const habitPromises = (toolCall.habits || []).map(habit =>
                addHabit({
                    title: habit.title.trim(),
                    frequency: habit.frequency || 'daily',
                    goalId: newGoalRef.id,
                    status: 'active'
                })
            );

            await Promise.all([...taskPromises, ...habitPromises]);

            showNotification(
                'encouragement',
                t('roadmapSaved')
            );
        }

        else if (toolCall.action === 'create_diary') {

            await addDoc(collection(db, 'diary_entries'), {
                userId: user.uid,
                title: toolCall.data.title || 'My Day',
                mood: toolCall.mood || toolCall.data.mood || 'good',
                content: toolCall.content || toolCall.data.content,
                tags: toolCall.tags || toolCall.data.tags || [],
                reflection: toolCall.reflection || toolCall.data.reflection || '',
                createdAt: serverTimestamp()
            });

            showNotification('success', t('diarySaved'));
        }

        else if (toolCall.action.startsWith('edit_') || toolCall.action.startsWith('delete_')) {
            const collectionMap = {
                'edit_task': 'tasks', 'delete_task': 'tasks',
                'edit_goal': 'goals', 'delete_goal': 'goals',
                'edit_habit': 'habits', 'delete_habit': 'habits',
                'edit_diary': 'diary_entries', 'delete_diary': 'diary_entries'
            };

            const collectionName = collectionMap[toolCall.action];
            const targetTitle = toolCall.targetTitle?.toLowerCase().trim();

            if (!collectionName || !targetTitle) {
                throw new Error("Invalid edit/delete request: missing targetTitle");
            }

            const q = query(collection(db, collectionName), where('userId', '==', user.uid));
            const snap = await getDocs(q);
            
            let matchedDoc = null;
            let highestMatchScore = -1;

            snap.docs.forEach(d => {
                const title = (d.data().title || d.data().name || '').toLowerCase().trim();
                if (title === targetTitle) {
                    matchedDoc = d;
                    highestMatchScore = 100;
                } else if (title.includes(targetTitle) && highestMatchScore < 50) {
                    matchedDoc = d;
                    highestMatchScore = 50;
                }
            });

            if (!matchedDoc) {
                throw new Error(`Could not find a ${collectionName.replace('_', ' ')} named '${toolCall.targetTitle}'`);
            }

            const isEdit = toolCall.action.startsWith('edit_');

            if (toolCall.action === 'delete_task') {
                await deleteTask(matchedDoc.id, matchedDoc.data().goalId, matchedDoc.data().notificationId);
            } else if (toolCall.action === 'edit_task') {
                await updateTask(matchedDoc.id, toolCall.updates || {}, matchedDoc.data().goalId);
            } else if (toolCall.action === 'delete_habit') {
                await deleteHabit(matchedDoc.id);
            } else if (toolCall.action === 'edit_habit') {
                await updateHabit(matchedDoc.id, toolCall.updates || {});
            } else if (toolCall.action === 'delete_goal') {
                await deleteGoal(matchedDoc.id);
            } else if (toolCall.action === 'edit_goal') {
                await updateGoal(matchedDoc.id, toolCall.updates || {});
            } else if (toolCall.action === 'delete_diary') {
                await deleteEntry(matchedDoc.id);
            } else if (toolCall.action === 'edit_diary') {
                await updateEntry(matchedDoc.id, toolCall.updates || {});
            }

            showNotification('success', isEdit ? 'Item updated successfully!' : 'Item deleted successfully!');
        }

        refreshProfile(true);
    };

    const sendMessage = async (text, hiddenContext = null, isSilent = false) => {
        if (!text || isAiTyping || !user) return;
        
        let activeSessionId = currentSessionIdRef.current;
        if (!activeSessionId) {
            const title = await generateChatTitle(text);
            const newSessionRef = await addDoc(collection(db, 'chat_sessions'), {
                userId: user.uid,
                title: title,
                topicSummary: "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            activeSessionId = newSessionRef.id;
            setCurrentSessionId(activeSessionId);
            setSessions(prev => [{ id: activeSessionId, title, topicSummary: "", createdAt: new Date() }, ...prev]);
        } else {
            setDoc(doc(db, 'chat_sessions', activeSessionId), { updatedAt: serverTimestamp() }, { merge: true });
        }

        if (!isSilent) {
            const userMsg = { id: Date.now().toString(), text, isUser: true };
            setMessages(prev => [...prev, userMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

            addDoc(collection(db, 'chat_messages'), {
                userId: user.uid,
                sessionId: activeSessionId,
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
                globalKnowledge,
                sessionSummaryRef.current,
                systemContextForRequest,
                language
            );
            console.log('[AI_DEBUG][AIChat:sendMessage:rawResponse]', {
                type: typeof rawResponse,
                length: rawResponse?.length || 0,
                preview: typeof rawResponse === 'string' ? rawResponse.slice(0, 240) : rawResponse
            });

            let finalResponseText = rawResponse;
            const intent = extractIntent(rawResponse);
            console.log('[AI_DEBUG][AIChat:sendMessage:intent]', intent);

            if (intent && !isFreshPlanningStart) {
                // Nova's prompt ensures she only emits JSON AFTER the user has already confirmed.
                // So we execute immediately — no second confirmation needed.
                try {
                    await executeToolCall(intent);
                    if (['create_task', 'create_habit', 'create_roadmap', 'create_goal', 'create_diary'].includes(intent.action)) {
                        activePlanningContextRef.current = '';
                    }
                } catch (e) {
                    console.warn('[AI_DEBUG][AIChat:executeToolCall:error]', {
                        message: e?.message,
                        stack: e?.stack,
                        intent
                    });
                    showNotification('error', t('updateError'));
                }

                // Strip markdown codeblocks, and the JSON block from the raw response to show only conversational text
                let cleanedText = rawResponse
                    .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '')
                    .replace(/\{[\s\S]*\}/g, '')
                    .trim();

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
                    } else if (intent.action === 'create_habit') {
                        finalResponseText = `Done! I've added the habit "${intent.data?.title}" 🔁`;
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
                sessionId: activeSessionId,
                text: finalResponseText,
                isUser: false,
                createdAt: serverTimestamp()
            }).catch(e => console.log('Log message failed:', e));

            // Background summarization
            messageCountSinceSummaryRef.current += 1;
            if (messageCountSinceSummaryRef.current >= 4) {
                messageCountSinceSummaryRef.current = 0;

                const historyToSummarize = chatHistoryRef.current.slice(-20);

                setTimeout(async () => {
                    try {
                        const newSummary = await summarizeConversation(sessionSummaryRef.current, historyToSummarize);
                        setSessionSummary(newSummary);
                        await setDoc(doc(db, 'chat_sessions', activeSessionId), { topicSummary: newSummary }, { merge: true });
                        
                        const newGlobalKnowledge = await updateGlobalKnowledge(globalKnowledge, newSummary);
                        setGlobalKnowledge(newGlobalKnowledge);
                        await setDoc(doc(db, 'user_memory', user.uid), { globalKnowledge: newGlobalKnowledge }, { merge: true });
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

    const STARTERS = [
        "How can I set a new destination?",
        "Help me plan my week.",
        "I need some motivation today.",
        "Reflect on my recent progress."
    ];

    const renderItem = ({ item, index }) => (
        <MotiView
            from={{ opacity: 0, translateY: 10, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'timing', duration: 350, delay: index > 0 ? 50 : 0 }}
            style={[styles.bubble, item.isUser ? styles.userBubbleWrapper : [styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }]]}
        >
            {item.isUser ? (
                <LinearGradient
                    colors={Theme.gradients.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.userBubbleGradient}
                >
                    <Text style={styles.userText} selectable={true}>
                        {item.text}
                    </Text>
                </LinearGradient>
            ) : (
                <>
                    <View style={[styles.aiIcon, { backgroundColor: colors.primaryLight }]}>
                        <Sparkles size={14} color={colors.primary} />
                    </View>
                    <Text style={[styles.aiText, { color: colors.textMain }]} selectable={true}>
                        {item.text}
                    </Text>
                </>
            )}
        </MotiView>
    );

    const renderEmptyState = () => {
        if (profileLoading || loadingHistory) return null;
        if (messages.length > 1) return null;

        return (
            <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 600, delay: 200 }}
                style={styles.emptyState}
            >
                <View style={[styles.emptyIconBadge, { backgroundColor: colors.primaryLight }]}>
                    <Sparkles size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>I'm Nova</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Your personal growth companion. How can I support your journey today?</Text>

                <View style={styles.starterGrid}>
                    {STARTERS.map((s, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.starterPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => {
                                setInputText(s);
                                sendMessage(s);
                            }}
                        >
                            <Text style={[styles.starterText, { color: colors.primary }]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </MotiView>
        );
    };

    const handleDeleteSession = async (sessionId) => {
        Alert.alert(
            "Delete Chat",
            "Are you sure you want to delete this chat?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setSessions(prev => prev.filter(s => s.id !== sessionId));
                            if (currentSessionId === sessionId) {
                                setCurrentSessionId(null);
                                setSessionSummary("");
                                const initial = INITIAL_MESSAGE(profile?.userName, t);
                                setMessages([initial]);
                                chatHistoryRef.current = [{
                                    role: 'assistant',
                                    parts: [{ text: initial.text }]
                                }];
                            }

                            await deleteDoc(doc(db, 'chat_sessions', sessionId));
                            
                            const q = query(collection(db, 'chat_messages'), where('sessionId', '==', sessionId));
                            const snap = await getDocs(q);
                            
                            if (!snap.empty) {
                                let batch = writeBatch(db);
                                let count = 0;
                                snap.docs.forEach(d => {
                                    batch.delete(d.ref);
                                    count++;
                                    if (count >= 400) {
                                        batch.commit();
                                        batch = writeBatch(db);
                                        count = 0;
                                    }
                                });
                                if (count > 0) {
                                    await batch.commit();
                                }
                            }
                            
                            showNotification('success', 'Chat deleted');
                        } catch (err) {
                            console.error('Delete chat error:', err);
                            showNotification('error', 'Failed to delete chat');
                        }
                    }
                }
            ]
        );
    };

    const renderSidebar = () => {
        return (
            <MotiView
                animate={{ translateX: isSidebarOpen ? 0 : -width * 0.8 }}
                transition={{ type: 'timing', duration: 300 }}
                style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border }]}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.sidebarHeader}>
                        <Text style={[styles.sidebarTitle, { color: colors.textMain }]}>Past Chats</Text>
                        <TouchableOpacity onPress={() => setIsSidebarOpen(false)} style={styles.closeSidebarBtn}>
                            <X size={24} color={colors.textMain} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={[styles.newChatBtn, { backgroundColor: colors.primaryLight }]} 
                        onPress={() => {
                            setCurrentSessionId(null);
                            setSessionSummary("");
                            setIsSidebarOpen(false);
                            const initial = INITIAL_MESSAGE(profile?.userName, t);
                            setMessages([initial]);
                            chatHistoryRef.current = [{
                                role: 'assistant',
                                parts: [{ text: initial.text }]
                            }];
                        }}
                    >
                        <Plus size={20} color={colors.primary} />
                        <Text style={[styles.newChatBtnText, { color: colors.primary }]}>New Chat</Text>
                    </TouchableOpacity>

                    <ScrollView style={styles.sessionList}>
                        {sessions.map(s => (
                            <TouchableOpacity 
                                key={s.id} 
                                style={[
                                    styles.sessionItem, 
                                    currentSessionId === s.id && [styles.activeSessionItem, { backgroundColor: colors.background, borderColor: colors.border }]
                                ]} 
                                onPress={() => { 
                                    setCurrentSessionId(s.id); 
                                    setSessionSummary(s.topicSummary || ''); 
                                    setIsSidebarOpen(false); 
                                }}
                            >
                                <MessageSquare size={16} color={currentSessionId === s.id ? colors.primary : colors.textSecondary} style={{ marginRight: 8 }} />
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={[
                                        styles.sessionTitle, 
                                        { color: currentSessionId === s.id ? colors.primary : colors.textMain }
                                    ]} numberOfLines={1}>
                                        {s.title || 'Chat'}
                                    </Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.deleteChatBtn}
                                    onPress={() => handleDeleteSession(s.id)}
                                >
                                    <Trash2 size={18} color={colors.error} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </SafeAreaView>
            </MotiView>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {renderSidebar()}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('aiGuideTitle')}</Text>
                    <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
                </View>
                <TouchableOpacity onPress={() => setIsSidebarOpen(true)} style={styles.menuButton}>
                    <Menu size={24} color={colors.textMain} />
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
                                <ActivityIndicator color={colors.primary} />
                                <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 8, fontSize: 13, fontFamily: Theme.typography.body }}>Reading your journey...</Text>
                            </View>
                        ) : renderEmptyState()
                    }
                />

                {isAiTyping && (
                    <View style={styles.typingIndicator}>
                        <Sparkles size={14} color={colors.primary} />
                        <Text style={[styles.typingText, { color: colors.textSecondary }]}>Nova is thinking...</Text>
                    </View>
                )}

                {showScrollDown && (
                    <TouchableOpacity
                        style={styles.scrollDownButtonWrapper}
                        onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    >
                        <LinearGradient
                            colors={Theme.gradients.hero}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.scrollDownButtonGradient}
                        >
                            <ArrowDown size={24} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.textMain, borderColor: colors.border }]}
                        placeholder="Ask anything..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        style={[styles.sendButtonWrapper, (!inputText.trim() || isAiTyping) && [styles.sendButtonDisabled, { backgroundColor: colors.border }]]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isAiTyping}
                    >
                        {(!inputText.trim() || isAiTyping) ? (
                            <View style={styles.sendButtonGradient}>
                                <Send size={20} color="#fff" />
                            </View>
                        ) : (
                            <LinearGradient
                                colors={Theme.gradients.hero}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.sendButtonGradient}
                            >
                                <Send size={20} color="#fff" />
                            </LinearGradient>
                        )}
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
    menuButton: { padding: 8, marginRight: -8 },
    sidebar: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: width * 0.8,
        zIndex: 100,
        borderRightWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    sidebarTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
    },
    closeSidebarBtn: {
        padding: 4,
    },
    newChatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: Theme.spacing.lg,
        padding: Theme.spacing.md,
        borderRadius: 12,
    },
    newChatBtnText: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        marginLeft: 8,
    },
    sessionList: {
        flex: 1,
        paddingHorizontal: Theme.spacing.md,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        borderRadius: 12,
        marginBottom: 8,
    },
    activeSessionItem: {
        borderWidth: 1,
    },
    sessionTitle: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        flex: 1,
    },
    deleteChatBtn: {
        padding: 4,
    },
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
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    userBubbleWrapper: {
        alignSelf: 'flex-end',
        borderRadius: 16,
        borderTopRightRadius: 4,
        ...Theme.shadows.sm,
    },
    userBubbleGradient: {
        padding: 12,
        borderRadius: 16,
        borderTopRightRadius: 4,
    },
    aiBubble: {
        padding: 12,
        borderRadius: 16,
        alignSelf: 'flex-start',
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        borderTopLeftRadius: 4,
        ...Theme.shadows.sm,
    },
    aiIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 0,
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
    sendButtonWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        ...Theme.shadows.sm,
    },
    sendButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Theme.colors.border,
        shadowOpacity: 0,
    },
    scrollDownButtonWrapper: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    scrollDownButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        marginTop: 40,
    },
    emptyIconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    starterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    starterPill: {
        backgroundColor: Theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    starterText: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
});
