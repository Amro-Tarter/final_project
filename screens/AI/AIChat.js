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

const INITIAL_MESSAGE = (name) => ({
    id: 'initial_msg',
    text: `Hello, ${name || 'Friend'}! 👋 I'm Nova, your personal companion. I've been looking at your progress and I'm here to help you grow. What's on your mind today?`,
    isUser: false,
});

export default function AIChat({ navigation, route }) {
    const { user } = useAuth();
    const { profile, loading: profileLoading, refreshProfile } = useUserProfile();
    const { showNotification } = useNotifications();
    // Silently synchronize AI profile when navigating to this tab
    useFocusEffect(
        useCallback(() => {
            refreshProfile(true);
        }, [refreshProfile])
    );
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [memorySummary, setMemorySummary] = useState('');
    const [showScrollDown, setShowScrollDown] = useState(false);
    const messageCountSinceSummaryRef = useRef(0);
    // Chat history format for AI context
    const chatHistoryRef = useRef([]);
    const flatListRef = useRef(null);

    // Load initial history from Firestore
    useEffect(() => {
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

    // Handle initial intent from route params
    useEffect(() => {
        if (!loadingHistory && route.params?.initialIntentText) {
            const intentText = route.params.initialIntentText;
            const hiddenContext = route.params.hiddenContext;
            // Clear the param so it doesn't fire again
            navigation.setParams({ initialIntentText: null, hiddenContext: null });

            // Give a slight delay for UI to settle
            setTimeout(() => {
                sendMessage(intentText, hiddenContext);
            }, 500);
        }
    }, [loadingHistory, route.params?.initialIntentText]);

    const sendMessage = async (text, hiddenContext = null) => {
        if (!text || isAiTyping || !user) return;

        const userMsg = { id: Date.now().toString(), text, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setIsAiTyping(true);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // Add to local history and firestore concurrently
        chatHistoryRef.current.push({ role: 'user', parts: [{ text }] });
        addDoc(collection(db, 'chat_messages'), {
            userId: user.uid,
            text,
            isUser: true,
            createdAt: serverTimestamp()
        }).catch(e => console.log('Log message failed:', e));

        try {
            const promptToSend = text;
            const rawResponse = await chatWithAI(profile, chatHistoryRef.current.slice(-8), promptToSend, memorySummary);

            let finalResponseText = rawResponse;
            try {
                // Check if it's a JSON tool call mixed with text
                let toolCall = null;

                try {
                    const jsonStart = rawResponse.indexOf('{');
                    const jsonEnd = rawResponse.lastIndexOf('}');

                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const possibleJson = rawResponse.slice(jsonStart, jsonEnd + 1);

                        const parsed = JSON.parse(possibleJson);

                        if (parsed.tool) {
                            toolCall = parsed;
                            finalResponseText = rawResponse.replace(possibleJson, '').trim();
                        }
                    }
                } catch (e) {
                    // silently ignore — NEVER show parsing errors to user
                }

                if (toolCall) {

                    if (toolCall.tool === 'create_goal') {
                        await addDoc(collection(db, 'goals'), {
                            userId: user.uid,
                            title: toolCall.title,
                            status: 'active',
                            progress: 0,
                            createdAt: serverTimestamp()
                        });
                        showNotification('Goal Created', `I've created a new goal "${toolCall.title}"`)
                        refreshProfile(true);
                    } else if (toolCall.tool === 'create_task') {
                        let targetGoalId = null;
                        if (toolCall.targetGoal) {
                            const goalsQuery = query(collection(db, 'goals'), where('userId', '==', user.uid), where('title', '==', toolCall.targetGoal));
                            const goalsSnap = await getDocs(goalsQuery);
                            if (!goalsSnap.empty) {
                                targetGoalId = goalsSnap.docs[0].id;
                            }
                        }
                        await addDoc(collection(db, 'tasks'), {
                            userId: user.uid,
                            title: toolCall.title,
                            goalId: targetGoalId,
                            status: 'pending',
                            priority: 'Normal',
                            due: toolCall.dueDate || null,
                            createdAt: serverTimestamp()
                        });
                        //instead of using system prefix use the notifications for that and for updated use the same thing
                        showNotification('Task Created', `I've added a new task "${toolCall.title}"`)
                        refreshProfile(true);
                    } else if (toolCall.tool === 'create_roadmap') {
                        const newGoalRef = await addDoc(collection(db, 'goals'), {
                            userId: user.uid,
                            title: toolCall.goalTitle,
                            status: 'active',
                            progress: 0,
                            createdAt: serverTimestamp()
                        });

                        const taskPromises = (toolCall.tasks || []).map(task => {
                            return addDoc(collection(db, 'tasks'), {
                                userId: user.uid,
                                title: task.title,
                                goalId: newGoalRef.id,
                                status: 'pending',
                                priority: 'Normal',
                                due: task.dueDate || null,
                                recurrence: task.recurrence || null,
                                reminder: task.reminder || null,
                                createdAt: serverTimestamp()
                            });
                        });
                        await Promise.all(taskPromises);
                        showNotification('Roadmap Created', `I've created a new roadmap "${toolCall.goalTitle}"`)
                        refreshProfile(true);
                    }

                    finalResponseText = finalResponseText;
                }
            } catch (e) {
                console.log("Execution error in tool handler:", e);
            }

            const aiMsg = { id: (Date.now() + 1).toString(), text: finalResponseText, isUser: false };
            setMessages(prev => [...prev, aiMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

            // Add AI response to local history and firestore
            chatHistoryRef.current.push({ role: 'assistant', parts: [{ text: finalResponseText }] });
            addDoc(collection(db, 'chat_messages'), {
                userId: user.uid,
                text: finalResponseText,
                isUser: false,
                createdAt: serverTimestamp()
            }).catch(e => console.log('Log message failed:', e));

            // Background Auto-Summarizer Trigger (every 8 messages)
            messageCountSinceSummaryRef.current += 1;
            if (messageCountSinceSummaryRef.current >= 8) {
                messageCountSinceSummaryRef.current = 0;

                const historyToSummarize = chatHistoryRef.current.slice(-10);
                setTimeout(async () => {
                    try {
                        const newSummary = await summarizeConversation(memorySummary, historyToSummarize);
                        setMemorySummary(newSummary);
                        await setDoc(doc(db, 'user_memory', user.uid), { summary: newSummary }, { merge: true });
                    } catch (err) {
                        console.error('Background summarization failed:', err);
                    }
                }, 500); // Wait 500ms to yield to UI animations
            }
        } catch (e) {
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
