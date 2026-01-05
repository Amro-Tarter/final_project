import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { ArrowLeft, Send, Sparkles } from 'lucide-react-native';

const MOCK_MESSAGES = [
    { id: '1', text: "Hello! I'm your productivity companion. How can I help you today?", isUser: false },
    { id: '2', text: "I'm feeling a bit overwhelmed with my tasks.", isUser: true },
    { id: '3', text: "I understand. Let's break it down. Which task is worrying you the most right now?", isUser: false },
];

export default function AIChat({ navigation }) {
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (!inputText.trim()) return;

        // Add user message
        const newMsg = { id: Date.now().toString(), text: inputText, isUser: true };
        setMessages(prev => [...prev, newMsg]);
        setInputText('');

        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "That sounds like a good plan. Let me know if you need help structuring that.",
                isUser: false
            }]);
        }, 1000);
    };

    const renderItem = ({ item }) => (
        <View style={[
            styles.bubble,
            item.isUser ? styles.userBubble : styles.aiBubble
        ]}>
            {!item.isUser && (
                <View style={styles.aiIcon}>
                    <Sparkles size={16} color="#fff" />
                </View>
            )}
            <Text style={[
                styles.messageText,
                item.isUser ? styles.userText : styles.aiText
            ]}>
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
                <Text style={styles.headerTitle}>AI Companion</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.chatContent}
                keyboardShouldPersistTaps="handled"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={Theme.colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Send size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
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
    headerTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    chatContent: {
        padding: Theme.spacing.lg,
    },
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: 'row',
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
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Theme.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    messageText: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        lineHeight: 22,
    },
    userText: {
        color: '#fff',
    },
    aiText: {
        color: Theme.colors.textMain,
        flexShrink: 1,
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
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        marginRight: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Theme.colors.border,
    },
});
