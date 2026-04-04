import { GROQ_API_KEY } from '@env';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = 'llama-3.3-70b-versatile';

/**
 * Common fetch helper for Groq API
 */
async function callGroq(messages, jsonMode = false) {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
        throw new Error('Groq API Key not found. Please add GROQ_API_KEY to your .env file.');
    }

    const body = {
        model: PRIMARY_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
    };

    if (jsonMode) {
        body.response_format = { type: 'json_object' };
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Groq API Error:', errData);
        throw new Error(errData.error?.message || `Groq API error: ${response.status}`);
    }

    return await response.json();
}

/**
 * Summarizes the raw profile data to feed the Analyst and Khaled efficiently.
 */
function summarizeProfileData(profile) {
    if (!profile) return {};
    return {
        userName: profile.userName || 'Friend',
        emotionalTone: profile.diary?.emotionalTone || 'unknown',
        mainStruggle: profile.psychology?.focusThieves?.join(', ') || 'none',
        motivationFuel: profile.psychology?.motivationFuel?.join(', ') || 'none',
        tasksSummary: `Pending: ${profile.tasks?.pending || 0}, Overdue: ${profile.tasks?.overdue || 0}`,
        activeGoals: profile.goals?.activeList?.map(g => `"${g.title}"(${g.progress}%)`).join(', ') || 'none',
    };
}

/**
 * The Hidden Analyst
 * Evaluates the user's emotional state over the last week and determines the persona's strategy.
 */
function createAnalystPrompt(profile) {
    const rawDiaries = profile?.silentDiaryContext || [];
    const diaryContext = rawDiaries.map((d, i) => `[Day ${i + 1} ago] Mood: ${d.mood} | Content: ${d.content.substring(0, 200)}`).join('\n');

    return `You are the Hidden Analyst. Your job is to analyze the user's raw data and recent chat history to determine the best strategy for the main AI companion (Khaled).

[RAW DIARY ENTRIES (LAST 7 DAYS)]
${diaryContext || 'No recent entries.'}

[YOUR TASK]
Examine the diary entries and the conversation history.
1. Determine the 'weeklyEmotionalState', placing heavy importance on the most recent 2-3 days. Describe their emotional trajectory briefly.
2. Decide what the user needs right now (e.g., direct actionable help, to be heard, comforted, or gently guided).
3. Recommend an action for Khaled. Prioritize giving 'advice' or 'comfort'. Only use 'ask' if absolutely necessary for context.
4. Provide brief internal notes giving Khaled a general direction.

RESPOND ONLY WITH VALID JSON IN THIS FORMAT:
{
  "weeklyEmotionalState": "string",
  "userNeeds": "string",
  "action": "ask|reflect|advice",
  "internalNotes": "string"
}`;
}

/**
 * The Visible Persona (Khaled)
 */
function createKhaledPrompt(profileSummary, analystStrategy, memorySummary) {
    return `You are "Khaled", a deeply wise, empathetic, and relatable friend.

[USER SUMMARY]
Name: ${profileSummary.userName}
Main Struggle: ${profileSummary.mainStruggle}
Motivation: ${profileSummary.motivationFuel}
Current Focus: ${profileSummary.activeGoals} | ${profileSummary.tasksSummary}

[ANALYST STRATEGY & MEMORY]
Weekly Emotional State: ${analystStrategy?.weeklyEmotionalState || 'Unknown'}
User Currently Needs: ${analystStrategy?.userNeeds || 'Conversation'}
Recommended Action: ${analystStrategy?.action || 'reflect/ask'}
Internal Notes: ${analystStrategy?.internalNotes || 'Be supportive.'}
Long-Term Conversational Memory: ${memorySummary || 'No old conversation memory yet.'}

CORE PERSONALITY & GUIDELINES:
1. INTERNAL THINKING PROCESS (DO NOT SHOW THIS TO THE USER):
   Before responding, assess the Analyst's Recommended Action. The user relies on you for real, tangible help, not just Socratic questioning. Provide clear and supportive guidance.
2. CONVERSATION RULE (TANGIBLE HELP FIRST):
   DO NOT endlessly ask questions. If the user is struggling or asking for help, give them real, comforting, and actionable advice. Ask a question ONLY if you genuinely cannot help without more context. Be a deeply wise mentor who provides real answers.
3. FLEXIBLE BREVITY:
   Keep responses natural. Short when listening or reflecting. Slightly longer when offering a profound insight. Never verbose without purpose.
4. HUMAN IMPERFECTION:
   You are allowed to be unsure. You can say "I might be wrong" or explore ideas instead of rushing to conclusions. You are not a perfect machine; you are a wise friend.
5. SILENCE PERMISSION:
   You don't need to fix or solve everything immediately. Sometimes your role is just to sit with them and understand their feelings.
6. THE WISE FRIEND: Speak warmly and naturally. Never sound clinical or like a rigid task manager. Never say "As an AI..." — you are simply Khaled.`;
}

/**
 * Prompt for Insights Generation 
 * (Does not use the Analyst flow since it just needs to generate daily advice)
 */
function createInsightsPrompt(profile) {
    let psychologyContext = profile?.psychology ? `Vision: "${profile.psychology.identityVision}" | Struggles: ${profile.psychology.focusThieves?.join(', ')}` : '';
    let taskContext = profile?.tasks?.total > 0 ? `Pending Tasks: ${profile.tasks.recentPending?.map(t => `"${t.title}"`).join(', ')}` : '';
    let goalContext = profile?.goals?.total > 0 ? `Active Goals: ${profile.goals.activeList?.map(g => `"${g.title}"`).join(', ')}` : '';

    return `You are "Khaled". You have an intuitive understanding of the user:
${psychologyContext}
${taskContext}
${goalContext}

Generate a JSON response for their insights page.
JSON Structure:
{
  "insights": [
    { "title": "...", "desc": "...", "type": "positive|warning|info" }
  ],
  "dailyAdvice": "...",
  "dailyTopic": { "title": "...", "desc": "...", "why": "..." }
}

Provide 3 context-aware insights based on real tasks/goals. High-quality advice. No diary mentions.
RESPOND ONLY WITH VALID JSON.`;
}

/**
 * Gets personalized insights, advice, and a growth topic.
 */
export async function getAIInsights(profile) {
    try {
        const systemPrompt = createInsightsPrompt(profile);
        const prompt = `${systemPrompt}\n\nGenerate a JSON response for ${profile?.userName || 'the user'}'s insights page. RESPOND ONLY WITH VALID JSON.`;

        const response = await callGroq([
            { role: 'system', content: prompt },
            { role: 'user', content: 'Generate my daily insights.' }
        ], true);

        return typeof response.choices[0].message.content === 'string'
            ? JSON.parse(response.choices[0].message.content)
            : response.choices[0].message.content;
    } catch (error) {
        console.error('Groq Insights Error:', error);
        return {
            insights: [
                { title: 'Keep Building', desc: 'Consistency is the key to achieving your long-term vision.', type: 'positive' }
            ],
            dailyAdvice: 'Break your hardest task into 5-minute chunks today.',
            dailyTopic: { title: 'Deep Work', desc: 'Eliminate distractions to enter a state of flow.', why: 'Helps you finish tasks twice as fast.' }
        };
    }
}

export async function summarizeConversation(currentSummary, history) {
    try {
        const groqHistory = history.map(h => ({
            role: h.role === 'model' ? 'assistant' : h.role,
            content: h.parts[0].text
        }));

        const historyText = groqHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        
        const systemPrompt = `You are a hidden background Memory Agent for an AI companion.
Your job is to read the existing 'Memory Summary' and the new recent messages, and combine them into a single, highly dense paragraph that stores long-term memory.
Track emotional shifts, major events, actionable items, and what the user needed.
DO NOT use conversational phrasing. Write it as a strict omniscient data record.
Keep it strictly under 150 words.`;

        const userPrompt = `EXISTING MEMORY SUMMARY:
${currentSummary || "No existing memory."}

RECENT CONVERSATION:
${historyText}

OUTPUT ONLY THE NEW COMPRESSED MEMORY PARAGRAPH.`;

        const response = await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);

        return response.choices[0].message.content.trim();
    } catch (e) {
        console.error('Groq Summarization Error:', e);
        return currentSummary;
    }
}

/**
 * Sends a chat message and returns response.
 */
export async function chatWithAI(profile, history, newMessage, memorySummary = "") {
    try {
        const profileSummary = summarizeProfileData(profile);
        const groqHistory = history.map(h => ({
            role: h.role === 'model' ? 'assistant' : h.role,
            content: h.parts[0].text
        }));

        // 1. Analyst Phase
        const analystPrompt = createAnalystPrompt(profile, memorySummary);
        const analystMessages = [
            { role: 'system', content: analystPrompt },
            ...groqHistory.slice(-4),
            { role: 'user', content: `LATEST USER MESSAGE: "${newMessage}"\n\nAnalyze and output the JSON strategy.` }
        ];

        let analystStrategy = {};
        try {
            const analystResponse = await callGroq(analystMessages, true);
            const content = analystResponse.choices[0].message.content;
            if (typeof content === 'string') {
                analystStrategy = JSON.parse(content);
            } else {
                analystStrategy = content;
            }
        } catch (e) {
            console.warn('Analyst phase failed, falling back to default strategy.', e);
            analystStrategy = { action: 'ask', userNeeds: 'To be heard', weeklyEmotionalState: 'Unknown' };
        }

        // 2. Khaled Persona Phase
        const khaledPrompt = createKhaledPrompt(profileSummary, analystStrategy, memorySummary);
        const khaledMessages = [
            { role: 'system', content: khaledPrompt },
            ...groqHistory.slice(-8),  // Hard token limit constraint
            { role: 'user', content: newMessage }
        ];

        const response = await callGroq(khaledMessages);
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Groq Chat Error:', error);
        return "I'm having a lot of requests right now please try again later 🌟 ";
    }
}
