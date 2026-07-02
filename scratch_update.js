const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'screens/Tasks/TaskForm.js',
    'screens/Tasks/TaskDetails.js',
    'screens/Habits/HabitForm.js',
    'screens/Habits/HabitDetails.js',
    'screens/Goals/GoalForm.js',
    'screens/Diary/DiaryForm.js',
    'screens/Diary/DiaryEntry.js',
];

for (const file of filesToUpdate) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Add GlassCard import
    if (!content.includes("import { GlassCard }")) {
        content = content.replace(
            /import \{ View, (.*?)\} from 'react-native';/g,
            "import { View, $1} from 'react-native';\nimport { GlassCard } from '../../components/ui/GlassCard';"
        );
    }

    // Replace <View style={[styles.card... or <MotiView style={[styles.card...
    content = content.replace(
        /<(View|MotiView)([^>]*?)style={\[styles\.card[^>]*?\]}([^>]*?)>/g,
        (match, tag, attr1, attr2) => {
            return `<${tag}${attr1}${attr2}>\n                <GlassCard style={[styles.card, { borderColor: colors.border }]}>`;
        }
    );

    // Now we need to close the GlassCard before the closing tag of View/MotiView
    // This is a bit tricky with regex, so let's do a manual string replace.
    // Usually it's at the end of the form elements.
    // Let's just find the closing tag corresponding to that block. Since MotiView with styles.card is usually the main wrapper in ScrollView, we can just look for `</MotiView>` or `</View>` right before the next MotiView or ScrollView close.
    // Actually, it's safer to just do manual multi_replace on the screens.
}
