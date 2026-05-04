export const ENCOURAGEMENT_LIBRARY = {
    1: [
        "Task completed 🌱 Every small move matters.",
        "You took action! That’s real progress 🤍",
        "One task down. You're doing it.",
        "Small wins build big futures. Keep going.",
        "That effort counts 🌿"
    ],
    2: [
        "Well done 💚 You’re building momentum.",
        "Another step completed on your journey ✨",
        "Great rhythm! I see your consistency.",
        "Steady work. I see your effort.",
        "You're making good progress today."
    ],
    3: [
        "Great work 🎉 You’re making real progress.",
        "This is consistency — and it leads to results 🌿",
        "Solid effort on this one!",
        "You are capable of hard things. Well done.",
        "Your future self thanks you for this action."
    ],
    4: [
        "Amazing effort 💪 You’ve come a long way.",
        "You should be proud of this milestone 🌟",
        "This is huge! Take a moment to celebrate.",
        "Incredible dedication. You're shining.",
        "Big move! You're really taking control."
    ],
    5: [
        "This is a big achievement 🏆 Truly well done.",
        "A major step forward ✨ Take a moment to appreciate it 🤍",
        "Outstanding! This is a major milestone.",
        "Celebrate this win! You did something great.",
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
