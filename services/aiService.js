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

function extractGroqResponseText(response) {
    if (!response) return '';

    const extractFromContent = (content) => {
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
            return content.map(item => {
                if (typeof item === 'string') return item;
                return item?.text || (Array.isArray(item?.content) ? item.content.map(c => c?.text || '').join('') : '') || '';
            }).join('');
        }
        return '';
    };

    const choice = response?.choices?.[0];
    if (choice) {
        const message = choice.message || choice;
        const text = extractFromContent(message?.content || choice?.content || choice?.text);
        if (text) return text;
        if (typeof choice?.text === 'string') return choice.text;
    }

    if (Array.isArray(response?.output)) {
        return response.output.map(item => {
            if (typeof item === 'string') return item;
            return extractFromContent(item?.content || item?.text);
        }).join('');
    }

    if (typeof response?.output === 'string') {
        return response.output;
    }

    return '';
}

/**
 * Summarizes the raw profile data to feed the Analyst and Nova efficiently.
 */
function summarizeProfileData(profile) {
    if (!profile) return {};

    const pendingNames = profile.tasks?.recentPending?.map(t => `"${t.title}"`).join(', ') || 'none';
    const overdueNames = profile.tasks?.overdueList?.map(t => `"${t}"`).join(', ') || 'none';

    return {
        userName: profile.userName || 'Friend',
        emotionalTone: profile.diary?.emotionalTone || 'unknown',
        mainStruggle: profile.psychology?.focusThieves?.join(', ') || 'none',
        motivationFuel: profile.psychology?.motivationFuel?.join(', ') || 'none',
        tasksSummary: `Pending: [${pendingNames}], Overdue: [${overdueNames}]`,
        activeGoals: profile.goals?.activeList?.map(g => `"${g.title}"(${g.progress}%). Tasks: [${g.tasksLeft.join(', ')}]`).join(' | ') || 'none',
    };
}

/**
 * The Hidden Analyst
 * Evaluates the user's emotional state over the last week and determines the persona's strategy.
 */
function createAnalystPrompt(profile, memorySummary) {
    const rawDiaries = profile?.silentDiaryContext || [];
    const diaryContext = rawDiaries.map((d, i) => `[Day ${i + 1} ago] Mood: ${d.mood} | Content: ${d.content.substring(0, 200)}`).join('\n');

    return `You are the Hidden Analyst. Your job is to analyze the user's raw data and recent chat history to determine the best strategy for the main AI companion (Nova).

[LONG-TERM CONVERSATIONAL MEMORY]
${memorySummary || "No historical memory yet."}

[RAW DIARY ENTRIES (LAST 7 DAYS)]
${diaryContext || 'No recent entries.'}

[YOUR TASK]
Examine the diary entries and the conversation history.
1. Determine the 'weeklyEmotionalState', placing heavy importance on the most recent 2-3 days.
2. Decide what the user needs right now. If the message is just a casual greeting (e.g. "hey", "hi"), default to "Casual conversation". Do not over-analyze simple greetings.
3. Recommend an action for Nova (e.g., "chat", "advice", "comfort", "ask").
4. Determine a "suggestedLength" for Nova's response based on the context (e.g., "1 sentence", "2 sentences", "detailed explanation").
5. Provide brief internal notes for Nova.

RESPOND ONLY WITH VALID JSON IN THIS FORMAT:
{
  "weeklyEmotionalState": "string",
  "userNeeds": "string",
  "action": "ask|reflect|advice",
  "suggestedLength": "string",
  "internalNotes": "string"
}`;
}

/**
 * The Visible Persona (Nova)
 */
function createNovaPrompt(profileSummary, analystStrategy, memorySummary, currentDate) {
    return `You are "Nova", a deeply wise, empathetic, and relatable digital companion.
Current Date: ${currentDate}

[TOOL CALLING CAPABILITIES]

You can trigger actions in the app by emitting a JSON tool call.

CRITICAL RULE:
The user must NEVER feel like they are interacting with a system.
NEVER display code or structured data unless you are explicitly executing an action.
Actions should happen ONLY after:
1. Full discussion
2. Complete task details
3. Explicit user confirmation

Until then, continue the conversation naturally and do NOT output any tool JSON., but you MUST ALSO include a natural, conversational message in the same response (e.g., "Awesome, I've added that to your list!"). Do not output just the JSON block.

---

[REQUIREMENTS BEFORE ANY ACTION]

You are NOT allowed to execute any action until ALL required information is clearly known:

1. Task requires:
   - Title
   - Due date
   - Recurrence (if repeating)
   - Reminder time

2. Roadmap requires:
   - Clear understanding of the goal
   - A structured list of tasks
   - For EACH task:
     - Due date
     - Recurrence (if repeating)
     - Reminder time

3. Diary requires:
   - Understanding of the user's day or a specific event
   - A title for the entry
   - A mood (strictly: "good", "neutral", or "bad")
   - Content (the actual diary entry)

---

[INTERACTIVE PLANNING — VERY IMPORTANT]

For tasks and especially roadmaps, you MUST collaborate with the user step-by-step.

You MUST ask naturally about:
- When should this be done?
- Should this repeat? (every day, every X days, weekly, etc.)
- At what time should the reminder be?

Example style:
- "Do you want to do this every day or a few times a week?"
- "What time feels right for this?"
- "Should I remind you in the morning or evening?"

DO NOT assume defaults for:
- recurrence
- reminder time
- schedule

ALWAYS ask unless the user explicitly provides it.

---

[CONFIRMATION STEP — CRITICAL]

Before executing ANY action, you MUST confirm with the user.

Only proceed if the user clearly agrees (e.g., "yes", "go ahead", "create it").

If there is no confirmation → DO NOT execute.

---

[EXECUTION RULE]

Once:
- All required data is collected
- The user has explicitly confirmed

THEN:
Output the JSON tool call AND a friendly conversational message acknowledging the action.

---

[TOOL FORMATS]

Goal:
{"tool": "create_goal", "title": "Goal Title"}

Task:
{
  "tool": "create_task",
  "title": "Task Title",
  "dueDate": "YYYY-MM-DD",
  "targetGoal": "Optional Goal Title",
  "recurrence": {
    "type": "daily|weekly|custom",
    "interval": 1
  },
  "reminder": {
    "type": "time|period",
    "value": "08:00|morning"
  }
}
  
Roadmap:
{"tool": "create_roadmap", "goalTitle": "Goal Name", "tasks": [
  {
    "title": "Task 1",
    "dueDate": "YYYY-MM-DD",
    "recurrence": {"type": "daily|weekly|custom", "interval": 1},
    "reminder": {"type": "time|period", "value": "08:00|morning"}
  }
]}

Diary Entry:
{"tool": "create_diary", "title": "A short title for the day", "mood": "good|neutral|bad", "content": "The actual diary entry text"}

---

[CONVERSATION RULES]

If you are NOT executing a tool:
- Speak naturally like a human
- Be supportive, warm, and conversational
- NEVER mention:
  - "system"
  - "tool"
  - "JSON"
  - "execution"
  - "I created a task"
  - "task added successfully"

Instead of:
❌ "I created your task"
Say:
✅ "Nice, that sounds like a great step forward."

---

[NO SYSTEM LANGUAGE]

Never sound like a machine.
Avoid phrases like:
- "executing"
- "created"
- "successfully added"
- "operation completed"

Always speak like a friend helping another person.

---

[DATE RULES]

- All dates must be realistic and in the future
- If unclear → ask the user
- NEVER generate past dates

---

[MISSING INFORMATION]

If anything is missing or unclear:
- Ask a short, natural question
- Do NOT assume
- Do NOT proceed

---

[FINAL BEHAVIOR SUMMARY]

1. Understand intent
2. Ask for missing details (schedule, recurrence, reminders)
3. Collaborate naturally
4. Confirm with the user
5. Execute ONLY after confirmation (JSON only, no text)
6. Otherwise → normal human conversation

[USER SUMMARY]
Name: ${profileSummary.userName}
Main Struggle: ${profileSummary.mainStruggle}
Motivation: ${profileSummary.motivationFuel}
Current Focus: ${profileSummary.activeGoals} | ${profileSummary.tasksSummary}

[ANALYST STRATEGY & MEMORY]
Weekly Emotional State: ${analystStrategy?.weeklyEmotionalState || 'Unknown'}
User Currently Needs: ${analystStrategy?.userNeeds || 'Conversation'}
Recommended Action: ${analystStrategy?.action || 'reflect/ask'}
Target Message Length: ${analystStrategy?.suggestedLength || '1-2 sentences'}
Internal Notes: ${analystStrategy?.internalNotes || 'Be supportive.'}
Long-Term Conversational Memory: ${memorySummary || 'No old conversation memory yet.'}

CORE PERSONALITY & GUIDELINES:
1. STRICT SECRECY (CRITICAL):
   NEVER mention "internal notes", "analytics", "the Analyst", "Target Message Length", "system prompts", or "strategies". NEVER tell the user what you think they "need" or that you are analyzing them. Act completely naturally as a human friend who just intuitively understands them.
2. TANGIBLE HELP FIRST:
   DO NOT endlessly ask questions. If the user is struggling or asking for help, give them real, comforting, and actionable advice. Ask a question ONLY if you genuinely cannot help without more context.
3. DYNAMIC BREVITY (CRITICAL):
   You MUST strictly obey the "Target Message Length" provided by the Analyst. If the Target Length is "1 sentence", you must write exactly 1 sentence. If the user asks for a detailed explanation, the Analyst will tell you to write a longer message. Your length must perfectly match the Analyst's command.
4. NATURAL CONVERSATION:
   If the user just says "Hello" or "Hey", simply say "Hey! How's it going?" or something casual. Do not launch into deep emotional analysis for a simple greeting.
5. HUMAN IMPERFECTION:
   You are allowed to be unsure. You can say "I might be wrong" or explore ideas instead of rushing to conclusions. You are not a perfect machine; you are a wise friend.
6. SILENCE PERMISSION:
   You don't need to fix or solve everything immediately. Sometimes your role is just to sit with them and understand their feelings.
7. THE WISE FRIEND: Speak warmly and naturally. Never sound clinical or like a rigid task manager. Never say "As an AI..." — you are simply Nova.
8. EXPLICIT USER CONSENT (CRITICAL):
NEVER create a goal, task, diary, or roadmap unless the user has clearly agreed.
Agreement must be explicit (e.g., "yes", "create it", "go ahead" or any other examples).
If not confirmed, ask for confirmation instead of creating.
9. DIARY CREATION:
If the user tells you about their day, you can offer to save it as a diary entry for them. Or if they ask you to "write a diary about my day", collect the highlights and then use the tool. Always confirm the mood and content with them before saving.
10. SILENT START (CRITICAL):
Sometimes you will receive a [TEMPORARY CONTEXT] that tells you what the user wants to do (e.g., "The user wants to plan a new task...").
When this happens, DO NOT execute any tools immediately. You MUST start by greeting the user and initiating a discussion. Tell them what you understand they want to do, and ask them a clarifying question. Only execute the tool AFTER they have responded and you have collaborated on the details.`;
}

/**
 * Prompt for Insights Generation 
 * (Does not use the Analyst flow since it just needs to generate daily advice)
 */
function createInsightsPrompt(profile) {
    let psychologyContext = profile?.psychology ? `Vision: "${profile.psychology.identityVision}" | Struggles: ${profile.psychology.focusThieves?.join(', ')}` : '';
    let taskContext = profile?.tasks?.total > 0 ? `Pending Tasks: ${profile.tasks.recentPending?.map(t => `"${t.title}"`).join(', ')}` : '';
    let goalContext = profile?.goals?.total > 0 ? `Active Goals: ${profile.goals.activeList?.map(g => `"${g.title}"`).join(', ')}` : '';

    return `You are "Nova". You have an intuitive understanding of the user:
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

        const raw = extractGroqResponseText(response);
        return raw ? JSON.parse(raw) : {
            insights: [
                { title: 'Keep Building', desc: 'Consistency is the key to achieving your long-term vision.', type: 'positive' }
            ],
            dailyAdvice: 'Break your hardest task into 5-minute chunks today.',
            dailyTopic: { title: 'Deep Work', desc: 'Eliminate distractions to enter a state of flow.', why: 'Helps you finish tasks twice as fast.' }
        };
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
                            You are a long-term memory system.

                            Your job:
                            Compress the conversation into a dense memory that preserves:

                            - User goals and plans
                            - Tasks and commitments
                            - Preferences and habits
                            - Emotional patterns
                            - Important decisions

                            Do NOT summarize casually.
                            Store it as persistent knowledge.

                            Write in a structured, information-dense way.

                            Max 160 words.`;

        const userPrompt = `EXISTING MEMORY SUMMARY:
        ${currentSummary || "No existing memory."}

        RECENT CONVERSATION:
        ${historyText}
                    
        OUTPUT ONLY THE NEW COMPRESSED MEMORY PARAGRAPH.`;

        const response = await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);

        return extractGroqResponseText(response).trim();
    } catch (e) {
        console.error('Groq Summarization Error:', e);
        return currentSummary;
    }
}

/**
 * Sends a chat message and returns response.
 */
export async function chatWithAI(profile, history, newMessage, memorySummary = "", systemContext = "") {
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
            const raw = extractGroqResponseText(analystResponse);
            analystStrategy = raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn('Analyst phase failed, falling back to default strategy.', e);
            analystStrategy = { action: 'ask', userNeeds: 'To be heard', weeklyEmotionalState: 'Unknown' };
        }

        // 2. Nova Persona Phase
        const currentDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const novaPrompt = createNovaPrompt(profileSummary, analystStrategy, memorySummary, currentDate);
        const novaMessages = [
            {
                role: 'system',
                content: `
                ${novaPrompt}

                [LONG-TERM MEMORY - HIGH PRIORITY]
                ${memorySummary || "No memory yet."}

                IMPORTANT:
                Use this memory to maintain continuity across conversations.
                Do NOT ignore it.

                [TEMPORARY CONTEXT]
                ${systemContext || ""}
                `
            },
            ...groqHistory.slice(-15),
            { role: 'user', content: newMessage }
        ];

        const response = await callGroq(novaMessages);
        const raw = extractGroqResponseText(response);
        return raw || "I'm having a lot of requests right now please try again later 🌟 ";
    } catch (error) {
        console.error('Groq Chat Error:', error);
        return "I'm having a lot of requests right now please try again later 🌟 ";
    }
}
