const getFirstValue = (...values) => values.find(value => value !== undefined && value !== null && value !== '');

const toDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeDueDate = (value) => {
    if (!value || typeof value !== 'string') return value;

    const normalized = value.trim().toLowerCase();
    const today = new Date();

    if (normalized === 'today') return toDateString(today);
    if (normalized === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return toDateString(tomorrow);
    }

    return value;
};

const normalizeTimeValue = (value) => {
    if (!value || typeof value !== 'string') return value;

    const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!match) return value;

    let hours = Number(match[1]);
    const minutes = match[2] || '00';
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const normalizeReminder = (value) => {
    if (!value) return null;
    if (typeof value === 'object') {
        return {
            ...value,
            value: normalizeTimeValue(value.value)
        };
    }

    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'none' || normalized === 'no' || normalized === 'no reminder') {
        return { type: 'none', value: '' };
    }
    if (normalized === 'morning' || normalized === 'evening') {
        return { type: 'period', value: normalized };
    }

    return { type: 'time', value: normalizeTimeValue(String(value)) };
};

const normalizeRecurrence = (value) => {
    if (!value) return null;
    if (typeof value === 'object') return value;

    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'none' || normalized === 'no' || normalized === 'no repeat') {
        return { type: 'none', interval: 1 };
    }
    if (normalized === 'daily' || normalized === 'weekly') {
        return { type: normalized, interval: 1 };
    }

    return { type: 'custom', interval: Number(normalized.match(/\d+/)?.[0]) || 1 };
};

const findJsonObjects = (text) => {
    const objects = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
        } else if (char === '{') {
            if (depth === 0) start = i;
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0 && start !== -1) {
                objects.push(text.slice(start, i + 1));
                start = -1;
            }
        }
    }

    return objects;
};

const normalizeTask = (task = {}) => ({
    title: getFirstValue(task.title, task.name, task.taskTitle, task.task),
    desc: getFirstValue(task.desc, task.description, ''),
    priority: getFirstValue(task.priority, 'Normal'),
    dueDate: normalizeDueDate(getFirstValue(task.dueDate, task.due, task.date, task.deadline, task.due_date)),
    reminder: normalizeReminder(getFirstValue(task.reminder, task.reminderTime, task.reminder_time, null)),
    recurrence: normalizeRecurrence(getFirstValue(task.recurrence, task.repeat, task.repeats, null))
});

export const extractIntent = (response) => {
    if (!response || typeof response !== 'string') return null;
    console.log('[AI_DEBUG][intentParser:start]', {
        responseLength: response.length,
        responsePreview: response.slice(0, 240)
    });

    const jsonObjects = findJsonObjects(response);
    console.log('[AI_DEBUG][intentParser:json_objects]', {
        count: jsonObjects.length,
        previews: jsonObjects.map(value => value.slice(0, 160))
    });

    for (const jsonStr of jsonObjects) {
        try {
            const parsed = JSON.parse(jsonStr);
            console.log('[AI_DEBUG][intentParser:parsed]', parsed);
            const payload = parsed.data && typeof parsed.data === 'object'
                ? { ...parsed.data, ...parsed }
                : parsed;
            const tool = getFirstValue(parsed.tool, parsed.action, parsed.name);
            console.log('[AI_DEBUG][intentParser:tool]', { tool, payload });

            if (!tool) continue;

            if (tool === 'create_goal') {
                return {
                    action: 'create_goal',
                    data: {
                        title: getFirstValue(payload.title, payload.goalTitle, payload.name),
                        deadline: getFirstValue(payload.deadline, payload.dueDate, payload.date),
                        tasks: Array.isArray(payload.tasks) ? payload.tasks.map(normalizeTask) : [],
                        habits: Array.isArray(payload.habits) ? payload.habits.map(h => ({
                            title: getFirstValue(h.title, h.name, h.habit),
                            frequency: getFirstValue(h.frequency, 'daily')
                        })) : []
                    }
                };
            }

            if (tool === 'create_task') {
                const intent = {
                    action: 'create_task',
                    targetGoal: getFirstValue(payload.targetGoal, payload.goal, payload.goalTitle, null),
                    data: normalizeTask(payload)
                };
                console.log('[AI_DEBUG][intentParser:intent]', intent);
                return intent;
            }

            if (tool === 'create_habit') {
                const intent = {
                    action: 'create_habit',
                    targetGoal: getFirstValue(payload.targetGoal, payload.goal, payload.goalTitle, null),
                    data: {
                        title: getFirstValue(payload.title, payload.name, payload.habit),
                        frequency: getFirstValue(payload.frequency, 'daily')
                    }
                };
                console.log('[AI_DEBUG][intentParser:intent]', intent);
                return intent;
            }

            if (tool === 'create_roadmap') {
                return {
                    action: 'create_roadmap',
                    goalTitle: getFirstValue(payload.goalTitle, payload.title, payload.name),
                    tasks: (payload.tasks || []).map(normalizeTask),
                    habits: (payload.habits || []).map(h => ({
                        title: getFirstValue(h.title, h.name, h.habit),
                        frequency: getFirstValue(h.frequency, 'daily')
                    }))
                };
            }

            if (tool === 'create_diary') {
                return {
                    action: 'create_diary',
                    mood: getFirstValue(payload.mood, 'neutral'),
                    content: getFirstValue(payload.content, payload.entry, payload.text, ''),
                    data: {
                        title: getFirstValue(payload.title, 'My Day')
                    }
                };
            }

            if (tool.startsWith('edit_')) {
                return {
                    action: tool,
                    targetTitle: payload.targetTitle || payload.title || payload.name,
                    updates: payload.updates || {}
                };
            }

            if (tool.startsWith('delete_')) {
                return {
                    action: tool,
                    targetTitle: payload.targetTitle || payload.title || payload.name
                };
            }
        } catch (e) {
            console.warn('[AI_DEBUG][intentParser:parse_error]', {
                message: e?.message,
                stack: e?.stack,
                jsonPreview: jsonStr.slice(0, 240)
            });
        }
    }

    console.log('[AI_DEBUG][intentParser:no_intent]');
    return null;
};
