# Goal Tracker App

A minimalist React Native app for tracking personal goals. Create goals with categories and deadlines, log your progress, and stay on top of what matters.

---

## Screenshots

> Place your screenshots inside an `assets/screenshots/` folder, then reference them like this:

```md
![Home Screen](assets/screenshots/home.png)
![Add Goal](assets/screenshots/add-goal.png)
![Goal Detail](assets/screenshots/detail.png)
```

---

## Features

- **Add Goals** — Create goals with a name, category, deadline, and description
- **Date Mode** — Pick a date from the calendar or enter "how many days from now"
- **Categories** — Personal, Career, Health, Education, Finance, Relationships, Hobby
- **Progress Journal** — Add progress notes to each goal
- **Sort & Filter** — Sort by days remaining, date, category, or name
- **Pin** — Pin important goals to the top as favorites
- **Complete** — Mark goals as done
- **Persistent Storage** — Data is saved with AsyncStorage and survives app restarts
- **Multi-language** — Supports Turkish, English, Simplified Chinese, Japanese, and Korean
- **Google Ads** — Banner ad support

---

## Tech Stack

| Package | Version |
|---------|---------|
| React Native | 0.81.5 |
| Expo | ~54.0.33 |
| React | 19.1.0 |
| AsyncStorage | ^2.2.0 |
| DateTimePicker | ^8.6.0 |
| Google Mobile Ads | ^16.0.3 |

---

## Supported Languages

| Code | Language | Script / Notes |
|------|----------|----------------|
| `tr` | Turkish | — |
| `en` | English | — |
| `zh` | Chinese | Simplified (zh-CN) |
| `ja` | Japanese | Hiragana, Katakana & Kanji |
| `ko` | Korean | Hangul |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start with Expo
npx expo start

# Android
npx expo start --android
```

> Requires an Android device or emulator.

---

## Project Structure

```
hedefapp/
├── App.js                          # Root component, state management
├── src/
│   ├── components/
│   │   ├── AddGoalModal.js         # Bottom-sheet modal for adding goals
│   │   ├── GoalDetailModal.js      # Goal detail & progress journal
│   │   ├── GoalCard.js             # List card component
│   │   ├── AppHeader.js            # Top header bar
│   │   ├── ControlsBar.js          # Sort & add controls
│   │   ├── FilterTabs.js           # Filter tab bar
│   │   ├── EmptyState.js           # Empty list placeholder
│   │   ├── Toast.js                # Notification component
│   │   └── AdBannerComponent.js    # Google Ads banner
│   ├── hooks/
│   │   └── useGoals.js             # Goal state & AsyncStorage logic
│   ├── i18n/
│   │   ├── LanguageContext.js      # Language context & provider
│   │   └── translations.js        # TR, EN, ZH, JA, KO translations
│   ├── utils/
│   │   └── dateUtils.js            # Date calculation helpers
│   └── constants/
│       ├── categories.js           # Category definitions
│       └── theme.js                # Colors & typography
└── assets/                         # Icons & images
```

---

## Built With AI

This app was developed with **Claude Sonnet 4.6** (Anthropic).

---

## License

MIT
