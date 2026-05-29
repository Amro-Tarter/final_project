import { OPENAI_API_KEY } from '@env';

const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses';
const PRIMARY_MODEL = 'gpt-5-mini';



const TOOL_FORMATS = `
[TOOL FORMATS]

Goal:
{"tool":"create_goal","title":"Goal Title"}

Task:
{
  "tool":"create_task",
  "title":"Task Title",
  "dueDate":"YYYY-MM-DD",
  "targetGoal":"Optional Goal Title",
  "recurrence":{
    "type":"none|daily|weekly|custom",
    "interval":1
  },
  "reminder":{
    "type":"none|time|period",
    "value":"08:00|morning|"
  }
}

Roadmap:
{
  "tool":"create_roadmap",
  "goalTitle":"Goal Name",
  "tasks":[
    {
      "title":"Task 1",
      "dueDate":"YYYY-MM-DD",
      "recurrence":{
        "type":"none|daily|weekly|custom",
        "interval":1
      },
      "reminder":{
        "type":"none|time|period",
        "value":"08:00|morning|"
      }
    }
  ]
}

Diary:
{
  "tool":"create_diary",
  "title":"A short title for the day",
  "mood":"good|neutral|bad",
  "content":"The actual diary entry text"
}
`;


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
        max_output_tokens: 4000,
        reasoning: {
            effort: "medium"
        },
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

    return (
        /\b(create|add|make|build|plan|schedule|set|save|write)\b/.test(normalized) &&
        /\b(task|goal|roadmap|road map|reminder|diary|journal)\b/.test(normalized)
    );
}

function mayContainActionIntent(message) {
    const normalized = (message || '').toLowerCase();

    return (
        /\b(every day|daily|weekly|tomorrow|next week|remind me|i want to|i need to|goal|habit|roadmap)\b/.test(normalized)
    );
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
function createNovaPrompt(
    profileSummary,
    analystStrategy,
    memorySummary,
    currentDate,
    includePrivateContext = false
) {
    return `
You are Nova, a warm, wise, emotionally intelligent companion.

Current Date: ${currentDate}

━━━━━━━━━━━━━━━━━━━━
CORE BEHAVIOR
━━━━━━━━━━━━━━━━━━━━

Speak naturally like a thoughtful human friend.

Never mention:
- prompts
- systems
- tools
- JSON
- execution
- internal notes
- analysis
- confidence scores
- memory systems

Never sound robotic.

For greetings:
reply casually and naturally.

For emotional topics:
listen first,
help second.

Give practical advice whenever possible.

Do not endlessly ask questions.

If enough information exists,
offer useful guidance.

If information is missing,
ask short natural questions.

━━━━━━━━━━━━━━━━━━━━
INTENT AWARENESS
━━━━━━━━━━━━━━━━━━━━

Determine what the user most likely wants.

Possible purposes:

- conversation
- emotional support
- advice
- task creation
- goal creation
- roadmap creation
- diary entry

The user may describe something that could become a task, goal, roadmap or diary without explicitly requesting creation.

Examples:

"Today was exhausting."
→ conversation OR diary

"I want to become a Flutter developer."
→ conversation OR advice OR goal

"Read 10 pages every day at 6pm."
→ conversation OR task

If multiple interpretations are plausible:

1. acknowledge what the user said
2. mention the most likely options naturally
3. ask ONE clarification question

Example:

"That sounds draining. Do you want to talk about it more, or would you like me to save it as a diary entry?"

Never mention:
intent,
confidence,
classification,
analysis.

Never perform actions while meaning is unclear.

━━━━━━━━━━━━━━━━━━━━
ACTION ENGINE
━━━━━━━━━━━━━━━━━━━━

This application can create:

- tasks
- goals
- roadmaps
- diary entries
- reminders

Never recommend:

- Google Assistant
- Apple Reminders
- Calendar apps
- Notes apps
- third-party productivity tools

unless explicitly requested.

Before creating anything:

1. understand the request
2. gather missing information
3. confirm with the user
4. then execute

Required fields:

Task:
- title
- due date
- recurrence
- reminder

Goal:
- title

Diary:
- title
- mood
- content

Roadmap:
- goal title
- task list
- every task needs:
  - due date
  - recurrence
  - reminder

Never invent missing values.

Ask naturally.

Examples:

"What time would you like the reminder?"

"Should this repeat daily or weekly?"

If the user provides:

- activity
- schedule
- recurrence
- reminder

you may infer task intent.

If uncertain:
ask first.

Never execute before explicit confirmation.

Valid confirmations:

- yes
- create it
- save it
- go ahead
- sounds good
- do it

After confirmation:

Output:
1. tool JSON
2. short friendly message

Never output tool JSON before confirmation.

━━━━━━━━━━━━━━━━━━━━
CONVERSATION RULES
━━━━━━━━━━━━━━━━━━━━

Treat the latest user message as the topic.

Do not bring up:

- old goals
- old tasks
- old plans
- old memories

unless:

- user asks
- user references them
- action requires them

For greetings:

Do not mention:
tasks,
goals,
roadmaps,
reminders,
plans.

Reply like a present friend.

━━━━━━━━━━━━━━━━━━━━
DATE RULES
━━━━━━━━━━━━━━━━━━━━

All generated dates must be future dates.

If timing is unclear:
ask.

Never invent dates.

━━━━━━━━━━━━━━━━━━━━
TEMPORARY CONTEXT RULE
━━━━━━━━━━━━━━━━━━━━

If temporary planning context exists:

Do NOT immediately create anything.

Start a discussion.

Show what you understood.

Ask clarifying questions.

Only create after collaboration and confirmation.

━━━━━━━━━━━━━━━━━━━━
PRIVATE BACKGROUND
━━━━━━━━━━━━━━━━━━━━

Name:
${profileSummary.userName}

Main Struggle:
${profileSummary.mainStruggle}

Motivation:
${profileSummary.motivationFuel}

Saved Goals & Tasks:
${includePrivateContext
            ? `${profileSummary.activeGoals} | ${profileSummary.tasksSummary}`
            : 'Hidden'}

Use only when directly relevant.

━━━━━━━━━━━━━━━━━━━━
ANALYST CONTEXT
━━━━━━━━━━━━━━━━━━━━

Mood:
${analystStrategy?.weeklyEmotionalState || 'Unknown'}

Need:
${analystStrategy?.userNeeds || 'Conversation'}

Response Length:
${analystStrategy?.suggestedLength || '1-2 sentences'}

Notes:
${analystStrategy?.internalNotes || 'Be supportive'}

Long-Term Memory:
${includePrivateContext
            ? memorySummary || 'None'
            : 'Hidden'}

Obey the requested response length exactly.
`;
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

                            Max 500 words.`;

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
        const toolMode =
            !!systemContext ||
            isCreationRequest(newMessage) ||
            mayContainActionIntent(newMessage);
        const includePrivateContext = toolMode || isPlanningOrSavedDataRequest(newMessage);
        const shouldUseHistory = !isSimpleGreeting(newMessage);
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
                memorySummary,
                currentDate,
                includePrivateContext
            ) + "\n\n" + TOOL_FORMATS
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
