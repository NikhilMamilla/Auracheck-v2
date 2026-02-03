# 🌟 Auracheck - Personalized Wellness Journey

**Auracheck** is a comprehensive wellness and mental health support platform designed to help users track their emotional well-being, manage stress, improve sleep, and connect with a supportive community. Powered by **Gemini AI**, it provides personalized insights and a supportive chatbot experience.

---

## 🚀 Live Demo
Access the live application here: **[https://login-406b1.web.app](https://login-406b1.web.app)**

---

## ✨ Key Features

### 📊 Holistic Wellness Tracking
- **Mood Tracker**: Log your emotional state daily and visualize trends over time.
- **Sleep Monitor**: Track sleep duration and consistency to optimize rest.
- **Stress Management**: Monitor stress levels and identify potential triggers.
- **Journaling**: Secure, private space for reflections and thoughts.

### 🤖 AI-Powered Assistant (Aurabot)
- Leveraging **Gemini 1.5 Flash** for empathetic and supportive conversations.
- Personalized wellness suggestions based on your logged data.
- Robust retry logic and optimized for stable performance.

### 🤝 Community & Support
- **Support Groups**: Join and interact with others in dedicated wellness communities.
- **Discussion Feeds**: Share experiences and support fellow members.
- **Real-time Chat**: Connect with community members in live discussions.

### 📈 Smart Insights
- Automated analysis of your wellness data.
- Identifying correlations (e.g., how sleep affects mood).
- Actionable suggestions for improving daily well-being.

---

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend / DB**: Firebase Firestore, Firebase Authentication
- **Hosting**: Firebase Hosting
- **AI Engine**: Google Gemini AI (1.5 Flash)
- **Icons**: React Icons (Ri, Fi, etc.)

---

## 🔧 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NikhilMamilla/Auracheck-v2.git
   cd auracheck
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

---

## 🏗 Deployment

The project is configured for **Firebase Hosting**. To deploy:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```

---

## 🛡 Security & Stability Updates (v2)

- **Firestore Security Rules**: Implemented granular, production-ready rules for data protection.
- **Optimized Indexing**: Deployed 9 composite indexes to ensure high-performance queries.
- **Stability Fixes**: Resolved infinite render loops and optimized API usage with exponential backoff retries.
- **Model Migration**: Migrated to `gemini-1.5-flash` for enhanced reliability and usage quotas.

---

## 👤 Author

**Nikhil Mamilla**
- [GitHub](https://github.com/NikhilMamilla)
- [Project Repository](https://github.com/NikhilMamilla/Auracheck-v2)

---

> Supporting your mental wellness journey, one step at a time.
