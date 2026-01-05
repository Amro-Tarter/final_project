# Achievements Ahead - Master Design Document (v2.0)

**Version**: 2.0 (The "Calm Companion" Update)
**Status**: Active Refinement
**Philosophy**: Anti-hustle, Emotionally Intelligent, Supportive.

---

## 1. 🕯️ Core Philosophy & UX Promise

### **The Promise**
"You are allowed to grow at your own pace. I support you — I never pressure you."

### **The Feeling**
-   **Calm First, Function Second**: One primary action per screen. Generous spacing.
-   **Progress Without Pressure**: No red "overdue" flags. No streaks. No guilt.
-   **Hybrid Model**:
    -   🟢 **Companion Layer** (Home): Grounding, emotional orientation.
    -   🔵 **Planner Layer** (Modules): Structured, powerful, but user-initiated.

---

## 2. 🧭 Navigation Architecture

**System**: Bottom Tab Navigation (Fixed 5 items).
**Rules**: App always opens on Home. Home is *not* a dashboard of lists.

1.  🏠 **Home** (Companion Mode)
2.  ✅ **Tasks** (Planner Mode)
3.  🎯 **Goals** (Road Trip Mode)
4.  📔 **Diary** (Reflection Mode)
5.  👤 **Profile** (Identity)

> **Note**: AI (🤖) is accessed contextually or via the Home card, not a dedicated tab.

---

## 3. 📱 Screen Specifications

### **1. 🏠 Home Screen (Companion Mode)**
**Goal**: Emotional orientation. "What matters now?"
**Allowed Components (Max 4)**:
1.  👋 **Warm Greeting**: "Hello, [Name]. How are you feeling?"
2.  🤍 **AI Companion Card**: "I'm here if you want support." (Leads to Chat)
3.  🌿 **Today's Focus**: 1-2 gentle steps. No huge lists.
4.  ?? **Current Destination**: Visual link to the active Goal.

**FORBIDDEN**: Counters, Red circles, "Overdue" text, dense lists.

### **2. ✅ Tasks (Planner Mode)**
**Goal**: Reduce cognitive load.
**Layout**:
-   Tabs: All / Pending / Completed.
-   List items: Clean, neutral status indicators.
-   **No 3D**. Pure utility but styled softly.

### **3. 🎯 Goals (The Road Trip)**
**Metaphor**: A Journey.
**Visuals**:
-   Vertical Timeline ("Roadmap").
-   Milestones = "Pit stops".
-   **3D Elements Allowed**: Subtle breathing shapes or path visualization in the header.

### **4. 📔 Diary (Reflection Space)**
**Priority**: Equal to Tasks/Goals.
**Flow**:
1.  Mood Selector (First interaction).
2.  Writing Area.
3.  AI Reflection (Data influences AI responses).

### **5. 🤖 AI Companion**
**Behavior**:
-   Never commands, only suggests.
-   Accessed via Home Card or contextual "Help me plan" buttons.
-   **Tone**: "Coaching", "Curious", "Soft".

---

## 4. 🎨 Visual & Motion System

### **Design Language**
-   **Style**: Premium Soft, Minimal.
-   **Colors**: Indigo/Lavender (Primary), Soft Green (Progress), Airy White/Slate (Backgrounds). **No harsh reds.**
-   **Typography**: Friendly Rounded Headers (Poppins) + Legible Body (Inter).
-   **Shapes**: Large border radius (16px-24px). Soft, non-directional shadows.

### **Motion & 3D Guidelines**
**Role**: Atmospheric, not strictly functional.
-   **Allowed**: Slow "breathing" motion (Home background), Floating abstract shapes (Goals).
-   **Forbidden**: 3D buttons, 3D inputs, Fast/Jerky transitions.
-   **Performance**: Must pause in background.

---

## 5. 🛠️ Implementation Plan (Refactor)

1.  **Refactor Navigation**: Switch `App.js` from simple Stack to `createBottomTabNavigator`.
2.  **Update Home UI**: Remove "Quick Actions" grid. Implement "Companion Card" and simplified Focus view.
3.  **Visual Polish**: Ensure all buttons and cards follow the "Soft" rules (no sharp edges, soft shadows).
4.  **Integration**: Ensure AI Entry point is prominent on Home but non-intrusive.
