import { useAuth } from '../context/AuthContext';

export function useWorkflow() {
    const { user } = useAuth();
    const answers = user?.onboardingAnswers || {};

    // For UI adjustments (Core Problem)
    const isPowerUser = answers.coreProblem?.includes("puzzle");
    const isOverwhelmed = answers.coreProblem?.includes("blur");

    // AI Support Preferences
    const supportPreference = answers.supportPreference;
    const isToughLove = supportPreference?.includes("stop whining");
    const isEmpathetic = supportPreference?.includes("reminding me how far");
    const isClinical = supportPreference?.includes("instruction manual");

    return {
        isPowerUser,
        isOverwhelmed,
        isToughLove,
        isEmpathetic,
        isClinical,
        dailyExecutionTime: answers.dailyExecutionTime,
        supportPreference,
        coreProblem: answers.coreProblem
    };
}
