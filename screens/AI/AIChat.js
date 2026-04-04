import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { ArrowLeft, Send, Sparkles, BarChart2 } from 'lucide-react-native';
import { useUserProfile } from '../../hooks/useUserProfile';
import { chatWithAI } from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const INITIAL_MESSAGE = (name) => ({
    id: 'initial_msg',
    text: `Hello, ${name || 'Friend'}! 👋 I'm Khaled, your personal companion. I've been looking at your progress and I'm here to help you grow. What's on your mind today?`,
    isUser: false,
});

export default function AIChat({ navigation }) {
    const { user } = useAuth();
    const { profile, loading: profileLoading } = useUserProfile();
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
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
                const snapshot = await getDocs(q);
                
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

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || isAiTyping || !user) return;

        const userMsg = { id: Date.now().toString(), text, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
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
            const response = await chatWithAI(profile, chatHistoryRef.current.slice(0, -1), text);

            const aiMsg = { id: (Date.now() + 1).toString(), text: response, isUser: false };
            setMessages(prev => [...prev, aiMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

            // Add AI response to local history and firestore
            chatHistoryRef.current.push({ role: 'assistant', parts: [{ text: response }] });
            addDoc(collection(db, 'chat_messages'), {
                userId: user.uid,
                text: response,
                isUser: false,
                createdAt: serverTimestamp()
            }).catch(e => console.log('Log message failed:', e));
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
                    <Text style={styles.headerTitle}>Khaled — AI Companion</Text>
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
                {profileLoading || loadingHistory ? (
                    <View style={styles.loadingWrap}>
                        <Sparkles size={32} color={Theme.colors.primary} />
                        <Text style={styles.loadingText}>Reading your journey...</Text>
                        <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 12 }} />
                    </View>
                ) : (
                    <>
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.chatContent}
                            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                            keyboardShouldPersistTaps="handled"
                        />

                        {isAiTyping && (
                            <View style={styles.typingIndicator}>
                                <Sparkles size={14} color={Theme.colors.primary} />
                                <Text style={styles.typingText}>Khaled is thinking...</Text>
                            </View>
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
                    </>
                )}
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
});
