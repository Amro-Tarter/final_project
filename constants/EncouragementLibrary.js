export const ENCOURAGEMENT_LIBRARY = {
    1: [
        "Nice step forward 🌱 Every small move matters.",
        "You showed up today — that’s already progress 🤍",
        "One step at a time. You're doing it.",
        "Small wins build big futures. Keep going.",
        "Gentle progress is still progress 🌿"
    ],
    2: [
        "Well done 💚 You’re building momentum.",
        "That’s another step on your journey ✨ Keep going gently.",
        "Good job! You're finding your rhythm.",
        "Steady and sure. I see your effort.",
        "You're doing good work today."
    ],
    3: [
        "Great work 🎉 You’re making real progress.",
        "This is consistency — and it matters a lot 🌿",
        "Look at you go! Solid effort.",
        "You are capable of hard things. Well done.",
        "Your future self thanks you for this."
    ],
    4: [
        "Amazing effort 💪 You’ve come a long way.",
        "You should be proud of this progress 🌟",
        "This is huge! Take a moment to smile.",
        "Incredible dedication. You're shining.",
        "Big moves! You're really engaging with your life."
    ],
    5: [
        "This is a big achievement 🏆 Truly well done.",
        "You reached something meaningful today ✨ Take a moment to appreciate it 🤍",
        "Outstanding! This is a major milestone.",
        "Celebrate yourself! You did something great.",
        "A mountaintop moment. Breathe it in."
    ]
};

export const getRandomEncouragement = (degree = 1) => {
    // Clamp degree between 1 and 5
    const safeDegree = Math.max(1, Math.min(5, degree));
    const messages = ENCOURAGEMENT_LIBRARY[safeDegree];
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
};
