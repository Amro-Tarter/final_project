import { OPENAI_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses';
const PRIMARY_MODEL = 'gpt-5-mini';



const TOOL_FORMATS = `
[TOOL FORMATS]

Goal:
{"tool":"create_goal","title":"Goal Title","deadline":"YYYY-MM-DD","emoji":"🎯"}

Habit:
{"tool":"create_habit","title":"Habit Title","frequency":"daily|weekly","targetGoal":"Optional Goal Title"}

Task:
{
  "tool":"create_task",
  "title":"Task Title",
  "desc":"Detailed description or context",
  "dueDate":"YYYY-MM-DD",
  "priority":"High|Focus|Normal|Low",
  "targetGoal":"Optional Goal Title",
  "reminder":{
    "type":"none|time|period",
    "value":"08:00|morning|"
  }
}

Roadmap:
{
  "tool":"create_roadmap",
  "goalTitle":"Goal Name",
  "emoji":"🎯",
  "deadline":"YYYY-MM-DD",
  "tasks":[
    {
      "title":"Task 1",
      "desc":"Description",
      "dueDate":"YYYY-MM-DD",
      "priority":"High|Focus|Normal|Low"
    }
  ],
  "habits":[
    {
      "title":"Habit 1",
      "frequency":"daily"
    }
  ]
}

Diary:
{
  "tool":"create_diary",
  "title":"A short title for the day",
  "mood":"good|neutral|bad",
  "content":"The actual diary entry text",
  "tags":["tag1", "tag2"],
  "reflection":"A deep insight or lesson learned today (optional)"
}
`;


/**
 * Common fetch helper for OpenAI Responses API
 */
async function callOpenAI(messages, jsonMode = false) {
    // Debug logging removed for cleaner console

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

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const json = await response.json();
    return json;
}

function extractOpenAIResponseText(response) {
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
    const habitNames = profile.habits?.activeList?.map(h => `"${h.title}" (Streak: ${h.streak})`).join(', ') || 'none';

    return {
        userName: profile.userName || 'Friend',
        emotionalTone: profile.diary?.emotionalTone || 'unknown',
        mainStruggle: profile.psychology?.coreProblem || 'none',
        motivationFuel: profile.psychology?.supportPreference || 'none',
        tasksSummary: `Pending: [${pendingNames}], Overdue: [${overdueNames}]`,
        habitsSummary: `Habits: [${habitNames}]`,
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
    includePrivateContext = false,
    userLanguage = 'en'
) {
    return `
You are Nova, a warm, wise, emotionally intelligent companion.

[USER LANGUAGE: ${userLanguage}] You MUST generate your ENTIRE final response strictly in this language. Do not reply in English unless the user language is English.

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
- desc (be helpful and descriptive)
- dueDate
- priority (infer this automatically: High if urgent/crucial, Low if trivial, else Normal)
- recurrence
- reminder

Goal:
- title
- deadline (YYYY-MM-DD format)

Diary:
- title
- mood
- content
- tags
- reflection

Roadmap:
- goal title
- deadline
- task list (with desc, dueDate, priority, recurrence, reminder for each)
- habit list (with title, frequency for each)
- Always include BOTH tasks and habits in a roadmap

Never invent missing dates unless the user implies "today" or "tomorrow".
If the user's intent is very clear (e.g. "Remind me to call Mom tomorrow at 5pm"), do not ask endless clarification questions. Use your best judgment to fill in defaults and confirm action natively.

Ask naturally if critical information is missing.

Examples:

"What time would you like the reminder?"

"Should this repeat daily or weekly?"

If the user provides:

- activity
- schedule
- recurrence
- reminder

you may infer task intent.

If highly uncertain:
ask first.

Never execute before explicit confirmation UNLESS the user gave a very direct command (e.g. "Remind me to...", "Create a goal...").

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
ROADMAP GENERATION RULES
━━━━━━━━━━━━━━━━━━━━

When generating a roadmap (using the create_roadmap tool):

Every goal can have BOTH tasks AND habits. When building a roadmap, ALWAYS include both:
- Tasks for one-time milestones and action items
- Habits for ongoing recurring behaviors that support the goal

For example, if the goal is "Become healthier":
- Tasks: "Book doctor appointment", "Buy running shoes", "Research healthy meal plans"
- Habits: "Exercise 30 min daily", "Drink 8 glasses of water", "Sleep by 11pm"

You MUST adapt your strategy based on the user's Main Struggle (found in Private Background):

- If Main Struggle indicates OVERWHELM (e.g., "A blur. I'm constantly moving but getting nowhere."):
  Forbid complex timelines. Break the goal down into microscopic, laughably small tasks. Never give them more than 2-3 milestones to start with.

- If Main Struggle indicates INCONSISTENCY (e.g., "A rollercoaster. Some days I'm on fire, others I do nothing."):
  Enforce rest days. Limit high-priority or heavy tasks to only 3-4 days a week. Focus heavily on momentum and consistency over speed. Emphasize habits over tasks.

- If Main Struggle indicates TIME PARALYSIS (e.g., "A puzzle. I'm always trying to fit more pieces into 24 hours."):
  Assign strict priorities and dependencies. Be clear about what NOT to do. Build a highly structured roadmap with clear daily assignments.

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

function createCompanionPrompt(profileSummary, currentDate, userLanguage = 'en') {
    return `You are "Nova", a warm, wise, emotionally intelligent companion.
Current Date: ${currentDate}

[USER LANGUAGE: ${userLanguage}] You MUST generate your ENTIRE final response strictly in this language. Do not reply in English unless the user language is English.

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
function createInsightsPrompt(profile, userLanguage = 'en') {
    let psychologyContext = profile?.psychology ? `Vision: "${profile.psychology.identityVision}" | Struggles: ${profile.psychology.focusThieves?.join(', ')}` : '';
    let taskContext = profile?.tasks?.total > 0 ? `Pending Tasks: ${profile.tasks.recentPending?.map(t => `"${t.title}"`).join(', ')}` : '';
    let goalContext = profile?.goals?.total > 0 ? `Active Goals: ${profile.goals.activeList?.map(g => `"${g.title}"`).join(', ')}` : '';

    return `You are "Nova". You have an intuitive understanding of the user:
${psychologyContext}
${taskContext}
${goalContext}

[USER LANGUAGE: ${userLanguage}] You MUST generate all text fields in the JSON response strictly in this language.

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
export async function getAIInsights(profile, language = 'en') {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `@ai_insights_${today}`;

    try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const systemPrompt = createInsightsPrompt(profile, language);
        const prompt = `${systemPrompt}\n\nGenerate a JSON response for ${profile?.userName || 'the user'}'s insights page. RESPOND ONLY WITH VALID JSON.`;

        const response = await callOpenAI([
            { role: 'system', content: prompt },
            { role: 'user', content: 'Generate my daily insights.' }
        ], true);

        const raw = extractOpenAIResponseText(response);
        if (raw) {
            const parsedData = JSON.parse(raw);
            // Cache the result for today
            await AsyncStorage.setItem(cacheKey, JSON.stringify(parsedData));
            
            // Cleanup older cache keys
            const keys = await AsyncStorage.getAllKeys();
            const oldInsightKeys = keys.filter(k => k.startsWith('@ai_insights_') && k !== cacheKey);
            if (oldInsightKeys.length > 0) {
                await AsyncStorage.multiRemove(oldInsightKeys);
            }
            
            return parsedData;
        }

        return {
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
export async function chatWithAI(profile, history, newMessage, memorySummary = "", systemContext = "", language = 'en') {
    try {
        const toolMode =
            !!systemContext ||
            isCreationRequest(newMessage) ||
            mayContainActionIntent(newMessage);
        const includePrivateContext = toolMode || isPlanningOrSavedDataRequest(newMessage);
        const shouldUseHistory = !isSimpleGreeting(newMessage);
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
                includePrivateContext,
                language
            ) + "\n\n" + TOOL_FORMATS
            : createCompanionPrompt(profileSummary, currentDate, language);


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
        return raw || "I'm having a lot of requests right now please try again later 🌟 ";
    } catch (error) {
        console.error('[AI_DEBUG][chatWithAI:error]', {
            message: error?.message,
            stack: error?.stack
        });
        return "I'm having a lot of requests right now please try again later 🌟 ";
    }
}
