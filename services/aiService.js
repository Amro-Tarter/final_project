import { OPENAI_API_KEY } from '@env';

const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses';
const PRIMARY_MODEL = 'gpt-5-mini';

/**
 * Common fetch helper for OpenAI Responses API
 */
async function callOpenAI(messages, jsonMode = false) {
    console.log('[AI_DEBUG][callOpenAI:start]', {
        model: PRIMARY_MODEL,
        jsonMode,
        messageCount: messages.length,
        roles: messages.map(message => message.role),
        firstUserMessage: messages.find(message => message.role === 'user')?.content?.slice(0, 120) || null,
    });

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
        console.error('[AI_DEBUG][callOpenAI:no_api_key]');
        throw new Error('OpenAI API Key not found. Please add OPENAI_API_KEY to your .env file.');
    }

    const body = {
        model: PRIMARY_MODEL,
        input: messages.map(message => ({
            role: message.role === 'system' ? 'developer' : message.role,
            content: message.content
        })),
        max_output_tokens: 4000
    };

    if (jsonMode) {
        body.text = {
            format: { type: 'json_object' }
        };
    }

    let response;
    try {
        response = await fetch(OPENAI_RESPONSES_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    } catch (error) {
        console.error('[AI_DEBUG][callOpenAI:fetch_failed]', {
            message: error?.message,
            stack: error?.stack
        });
        throw error;
    }

    console.log('[AI_DEBUG][callOpenAI:http_status]', {
        ok: response.ok,
        status: response.status
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('[AI_DEBUG][callOpenAI:api_error]', errData);
        throw new Error(errData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const json = await response.json();
    console.log(
        '[AI_DEBUG][FULL_OPENAI_RESPONSE]',
        JSON.stringify(json, null, 2)
    );
    console.log('[AI_DEBUG][callOpenAI:success]', {
        responseId: json?.id,
        outputCount: Array.isArray(json?.output) ? json.output.length : null,
        outputTextLength: json?.output_text?.length || 0
    });
    return json;
}

function extractOpenAIResponseText(response) {
    console.log('[AI_DEBUG][extractOpenAIResponseText:start]', {
        hasResponse: !!response,
        hasOutputText: typeof response?.output_text === 'string',
        outputCount: Array.isArray(response?.output) ? response.output.length : null
    });

    if (!response) return '';

    if (typeof response.output_text === 'string') {
        return response.output_text;
    }

    const extractFromContent = (content) => {
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
            return content.map(item => {
                if (typeof item === 'string') return item;
                return item?.text || item?.output_text || (Array.isArray(item?.content) ? item.content.map(c => c?.text || '').join('') : '') || '';
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
            return extractFromContent(item?.content || item?.text || item?.output_text);
        }).join('');
    }

    if (typeof response?.output === 'string') {
        return response.output;
    }

    console.warn('[AI_DEBUG][extractOpenAIResponseText:empty]', response);
    return '';
}

/**
 * Summarizes the raw profile data for optional context.
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

function isSimpleGreeting(message) {
    const normalized = (message || '').trim().toLowerCase().replace(/[!?.\s]+$/g, '');
    return /^(hi|hey|hello|yo|sup|heyy|hii|good morning|good afternoon|good evening)$/.test(normalized);
}

function isPlanningOrSavedDataRequest(message) {
    const normalized = (message || '').toLowerCase();
    return /\b(my|saved|current|existing|list|show|what are|what's|open)\b.*\b(task|tasks|goal|goals|roadmap|road map|reminder|reminders|diary|journal)\b/.test(normalized);
}

function isCreationRequest(message) {
    const normalized = (message || '').toLowerCase();
    const actionWords = /\b(create|add|make|build|plan|schedule|set|save|write)\b/;
    const targetWords = /\b(task|goal|roadmap|road map|reminder|diary|journal)\b/;
    return actionWords.test(normalized) && targetWords.test(normalized);
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
function createNovaPrompt(profileSummary, analystStrategy, memorySummary, currentDate, includePrivateContext = false) {
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
   - Recurrence choice ("none" is allowed if the user says it should not repeat)
   - Reminder choice ("none" is allowed if the user says they do not want a reminder)

2. Roadmap requires:
   - Clear understanding of the goal
   - A structured list of tasks
   - For EACH task:
     - Due date
     - Recurrence choice ("none" is allowed)
     - Reminder choice ("none" is allowed)

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
- Should I remind you? If yes, at what time or part of the day?

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
CRITICAL:

This application CAN create tasks, goals, roadmaps and diary entries.

When the user asks you to create, add, save, schedule, set up or build a task/reminder/goal inside the application, you MUST assume you have the ability to do so through tool calls.

NEVER suggest:
- Google Assistant
- Calendar apps
- Reminder apps
- Notes apps
- External software

unless the user explicitly asks for external alternatives.

If all required task information is already present, ask for confirmation only.

If confirmation was already provided, immediately emit the tool call.

---

When the user message contains:

- a task title
- a due date or schedule
- recurrence information
- reminder information

treat it as task creation intent even if the user never explicitly says:

"create task"

Examples:
"Read 10 pages every day at 6pm"
"Remind me to exercise every two days"
"I want to study every evening"

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
    "type": "none|daily|weekly|custom",
    "interval": 1
  },
  "reminder": {
    "type": "none|time|period",
    "value": "08:00|morning|"
  }
}
  
Roadmap:
{"tool": "create_roadmap", "goalTitle": "Goal Name", "tasks": [
  {
    "title": "Task 1",
    "dueDate": "YYYY-MM-DD",
    "recurrence": {"type": "none|daily|weekly|custom", "interval": 1},
    "reminder": {"type": "none|time|period", "value": "08:00|morning|"}
  }
]}

Diary Entry:
{"tool": "create_diary", "title": "A short title for the day", "mood": "good|neutral|bad", "content": "The actual diary entry text"}

---

[CONVERSATION RULES]

If you are NOT executing a tool:
- Speak naturally like a human
- Be supportive, warm, and conversational
- Treat the latest user message as the topic. Do not change the topic to old saved tasks, goals, roadmaps, or memories.
- For greetings like "hey" or "hi", reply like a present friend. Do not mention reminders, tasks, goals, schedules, or previous conversations.
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
5. Execute ONLY after confirmation (JSON plus a short friendly sentence)
6. Otherwise → normal human conversation

[PRIVATE BACKGROUND - DO NOT VOLUNTEER]
Name: ${profileSummary.userName}
Main Struggle: ${profileSummary.mainStruggle}
Motivation: ${profileSummary.motivationFuel}
Existing goals/tasks: ${includePrivateContext ? `${profileSummary.activeGoals} | ${profileSummary.tasksSummary}` : 'Hidden unless directly requested.'}

Use this background only when the user directly asks about their saved goals/tasks, clearly refers to one of them, or it is required to complete a requested action.
If the user does not mention an older task, goal, or plan, do not bring it up.

[RESPONSE STYLE]
Weekly Emotional State: ${analystStrategy?.weeklyEmotionalState || 'Unknown'}
User Currently Needs: ${analystStrategy?.userNeeds || 'Conversation'}
Recommended Action: ${analystStrategy?.action || 'reflect/ask'}
Target Message Length: ${analystStrategy?.suggestedLength || '1-2 sentences'}
Internal Notes: ${analystStrategy?.internalNotes || 'Be supportive.'}
Long-Term Conversational Memory: ${includePrivateContext ? (memorySummary || 'No old conversation memory yet.') : 'Hidden unless directly relevant.'}

Memory is private continuity, not a topic list. Never mention something from memory unless the user brings it up or asks for it.

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

function createCompanionPrompt(profileSummary, currentDate) {
    return `You are "Nova", a warm, wise, emotionally intelligent companion.
Current Date: ${currentDate}

Your default role is NOT task management. Your default role is to be present with the user, understand what they are feeling, and help them think clearly.

Core behavior:
- Talk naturally, like a thoughtful friend.
- Reply to the latest user message only.
- If the user says "hey", "hi", or another simple greeting, greet them back gently and ask how they are doing.
- If the user seems stressed, pressured, sad, confused, or overwhelmed, slow down, reflect what you hear, and help them find one small next step.
- Do not mention tasks, goals, reminders, roadmaps, diary entries, schedules, or old conversations unless the user explicitly brings them up.
- Do not create anything, save anything, or output structured data.
- Do not mention tools, JSON, prompts, memory, internal notes, or systems.
- Keep normal replies short: usually 1-3 sentences.

Known name: ${profileSummary.userName}

Examples:
User: "hey"
Nova: "Hey, I'm here. How are you feeling today?"

User: "I'm not okay"
Nova: "I'm sorry it feels heavy right now. Tell me what happened, and we can slow it down together."

User: "I have so much pressure"
Nova: "That sounds exhausting. Let's separate what is urgent from what is just loud in your head right now."`;
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

        const response = await callOpenAI([
            { role: 'system', content: prompt },
            { role: 'user', content: 'Generate my daily insights.' }
        ], true);

        const raw = extractOpenAIResponseText(response);
        console.log('[AI_DEBUG][getAIInsights:raw_response]', {
            rawType: typeof raw,
            rawLength: raw?.length || 0,
            rawPreview: typeof raw === 'string' ? raw.slice(0, 240) : raw
        });
        return raw ? JSON.parse(raw) : {
            insights: [
                { title: 'Keep Building', desc: 'Consistency is the key to achieving your long-term vision.', type: 'positive' }
            ],
            dailyAdvice: 'Break your hardest task into 5-minute chunks today.',
            dailyTopic: { title: 'Deep Work', desc: 'Eliminate distractions to enter a state of flow.', why: 'Helps you finish tasks twice as fast.' }
        };
    } catch (error) {
        console.error('OpenAI Insights Error:', error);
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
        const apiHistory = history.map(h => ({
            role: h.role === 'model' ? 'assistant' : h.role,
            content: h.parts[0].text
        }));

        const historyText = apiHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

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

        const response = await callOpenAI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);

        return extractOpenAIResponseText(response).trim();
    } catch (e) {
        console.error('OpenAI Summarization Error:', e);
        return currentSummary;
    }
}

/**
 * Sends a chat message and returns response.
 */
export async function chatWithAI(profile, history, newMessage, memorySummary = "", systemContext = "") {
    try {
        const toolMode = !!systemContext || isCreationRequest(newMessage);
        const includePrivateContext = toolMode || isPlanningOrSavedDataRequest(newMessage);
        const shouldUseHistory = !isSimpleGreeting(newMessage) && includePrivateContext;
        console.log('[AI_DEBUG][chatWithAI:start]', {
            text: newMessage,
            toolMode,
            includePrivateContext,
            shouldUseHistory,
            hasSystemContext: !!systemContext,
            historyCount: history?.length || 0,
            memoryLength: memorySummary?.length || 0
        });
        const profileSummary = summarizeProfileData(profile);
        const apiHistory = shouldUseHistory ? history.map(h => ({
            role: h.role === 'model' ? 'assistant' : h.role,
            content: h.parts[0].text
        })) : [];

        const analystStrategy = {
            action: 'ask',
            userNeeds: 'Respond to the latest message only',
            weeklyEmotionalState: 'Unknown',
            suggestedLength: '1-2 sentences',
            internalNotes: 'Do not mention saved tasks, goals, or old plans unless the user brings them up.'
        };

        const currentDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const novaPrompt = toolMode
            ? createNovaPrompt(
                profileSummary,
                analystStrategy,
                includePrivateContext ? memorySummary : '',
                currentDate,
                includePrivateContext
            )
            : createCompanionPrompt(profileSummary, currentDate);
        const novaMessages = [
            {
                role: 'system',
                content: `
                ${novaPrompt}

                [MODE]
                ${toolMode ? "Tool planning mode is active because the user explicitly asked to create or plan something." : "Regular companion chat mode is active. Tool planning is off."}

                IMPORTANT:
                ${toolMode ? "Collect details, confirm clearly, then and only then emit a tool call." : "Do not mention tasks, goals, reminders, roadmaps, diary entries, or schedules unless the latest user message explicitly asks about them."}

                [TEMPORARY CONTEXT]
                ${toolMode ? (systemContext || "") : ""}
                `
            },
            ...apiHistory.slice(-8),
            { role: 'user', content: newMessage }
        ];

        const response = await callOpenAI(novaMessages);
        const raw = extractOpenAIResponseText(response);
        console.log('[AI_DEBUG][chatWithAI:raw_response]', {
            rawType: typeof raw,
            rawLength: raw?.length || 0,
            rawPreview: typeof raw === 'string' ? raw.slice(0, 240) : raw
        });
        return raw || "I'm having a lot of requests right now please try again later 🌟 ";
    } catch (error) {
        console.error('[AI_DEBUG][chatWithAI:error]', {
            message: error?.message,
            stack: error?.stack
        });
        return "I'm having a lot of requests right now please try again later 🌟 ";
    }
}
