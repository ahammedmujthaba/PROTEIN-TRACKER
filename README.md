# ⚡ Protein Tracker — Scientific Macro & Habit Engine

A modern, high-performance web and mobile application designed to simplify daily protein tracking, protect lean muscle mass, and build lifelong nutritional discipline.

![License](https://img.shields.io/badge/License-MIT-emerald)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android-blue)
![Framework](https://img.shields.io/badge/Mobile-Expo%20SDK%2052-purple)
![Style](https://img.shields.io/badge/Theme-Obsidian%20Slate-darkgreen)

---

## 🌟 Key Features

### 🧬 1. 5-Step Guided Scientific Onboarding Quiz
Calculates personalized daily targets and per-meal distribution based on biological driver, body weight ($kg \leftrightarrow lbs$), and training volume:
- **💉 GLP-1 Muscle Shield** ($2.2g/kg$): Clinically calibrated to prevent skeletal muscle and metabolic loss on Ozempic, Wegovy, or Mounjaro.
- **💪 Hypertrophy & Muscle Gain** ($2.0g/kg$): Maximizes Muscle Protein Synthesis (MPS) and post-workout tissue repair.
- **🔥 Fat Loss & Lean Shred** ($2.2g/kg$): Spares muscle during calorie deficits while maximizing the thermic effect of food (TEF).
- **⚡ Athletic Recovery & Power** ($1.8g/kg$): Restores amino acid reserves and speeds up micro-trauma repair between training days.
- **🌿 Daily Tone & Health** ($1.4g/kg$): Sustains daily energy, curbs afternoon cravings, and promotes metabolic health.

### 🍽️ 2. Dynamic Meal Breakout Engine
- Select between **2 to 6 meals/day**.
- Automatically rebalances remaining targets in real time. If you log 40g for breakfast, your upcoming lunch and dinner targets dynamically adjust so you hit your daily total with zero mental math.

### 🎯 3. Goal-Specific Deficit Rescue Coach & Smart Bridges
When lagging behind daily targets, the coach activates with tailored clinical solutions and **1-tap rapid bridge buttons**:
- **GLP-1 Users**: High-density liquid isolates and clear whey recommendations to bypass appetite suppression without nausea.
- **Hypertrophy**: Overnight slow-release casein and Greek yogurt reminders to prevent nocturnal muscle catabolism.
- **Fat Loss**: Lean satiety options (egg whites, tuna) to shut down evening ghrelin spikes.

### 🏆 4. Habit Quests & Progression Ranks
- **3-Day 20g Breakfast Challenge**: Morning consistency habit to trigger early Muscle Protein Synthesis.
- **7-Day Titan**: 100% daily goal attainment streak.
- **XP Ranks**: Level up from **Iron Starter** ➔ **Bronze Lifter** ➔ **Silver Athlete** ➔ **Gold Titan** ➔ **Mythic Beast**.

### ⚡ 5. 1-Tap Fast Logging & Custom Presets
- **1-Tap Quick Presets**: Instant one-click additions with customizable food catalog (Whey, Chicken, Eggs, Greek Yogurt, Tuna, Ribeye).
- **Tactile Steppers**: `+5g`, `+10g`, `+20g`, `+30g` pills.
- **Flame Streak System**: Animated consistency counter with celebratory confetti and sound effects.

---

## 🚀 Quick Start (Web App)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ahammedmujthaba/PROTEIN-TRACKER.git
   cd PROTEIN-TRACKER
   ```

2. **Start the local dev server**:
   ```bash
   node server.js
   ```

3. **Open in your browser**:
   👉 `http://localhost:3000/`

---

## 📱 Mobile App (Expo / PWA)

### Option A: Mobile Browser (Instant PWA)
- Connect your phone to the same Wi-Fi as your computer.
- Open Safari (iOS) or Chrome (Android) and navigate to:
  `http://<YOUR_LOCAL_IP>:3000/` (e.g. `http://192.168.1.35:3000/`).
- Tap **"Add to Home Screen"** to install as a standalone native app.

### Option B: Expo Go Mobile App
1. Navigate to the `mobile` directory:
   ```bash
   cd mobile
   npm install
   ```
2. Start the Expo server:
   ```bash
   npx expo start -c
   ```
3. Scan the generated QR code using the **Expo Go** app on Android or the **Camera** app on iPhone.

---

## 📂 Project Structure

```
PROTEIN-TRACKER/
├── index.html          # Main application structure, modals, and templates
├── style.css           # Obsidian dark theme design system & responsive layout
├── app.js              # State machine, onboarding quiz, and deficit coach logic
├── server.js           # Lightweight Node.js local & LAN HTTP server
├── favicon.svg         # Branded vector app icon
├── package.json        # Project metadata
├── README.md           # Documentation
└── mobile/             # Expo SDK 52 React Native project
    ├── App.js          # Full-screen native WebView wrapper
    ├── app.json        # Expo app configuration
    └── package.json    # Expo dependencies (react-native-webview, expo)
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
