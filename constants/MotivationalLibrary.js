export const MOTIVATIONAL_QUOTES = [
    "Small steps make the difference. Keep going 🕊️",
    "Consistency is the secret to growth 🌱",
    "Focus on the process, the results will follow 🌿",
    "Every effort counts, no matter how small 🤍",
    "Your future self will thank you for starting today ✨",
    "Progress over perfection, always 🕯️",
    "A journey of a thousand miles begins with a single step 🏔️",
    "Believe in the power of showing up for yourself 🌟",
    "Be patient with yourself. Growth takes time ⏳",
    "Small wins are still wins. Keep moving forward 🚶‍♂️",
    "You are capable of more than you think 💫",
    "The best time to start was yesterday. The next best time is now ⏰",
    "One day at a time. One breath at a time 🌬️",
    "Your pace doesn't matter, as long as you don't stop 🐢",
    "Dream big, act small, start now 🎯"
];

export const getRandomMotivation = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
};
