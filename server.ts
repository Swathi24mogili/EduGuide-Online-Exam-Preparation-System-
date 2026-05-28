import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

import { 
  Subject, Topic, QuestionPaper, StudyMaterial, MockTest, 
  ScoreRecord, Notification, Bookmark, LeaderboardEntry, Feedback, Student 
} from "./src/types.js";

// Make sure imports are resolved properly
import { 
  INITIAL_SUBJECTS, INITIAL_TOPICS, INITIAL_PAPERS, 
  INITIAL_MATERIALS, INITIAL_MOCK_TESTS, INITIAL_NOTIFICATIONS, 
  INITIAL_LEADERBOARD, INITIAL_FEEDBACK 
} from "./src/data.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Main App State (In-Memory database to allow complete CRUD)
let subjects = [...INITIAL_SUBJECTS];
let topics = [...INITIAL_TOPICS];
let papers = [...INITIAL_PAPERS];
let materials = [...INITIAL_MATERIALS];
let mockTests = [...INITIAL_MOCK_TESTS];
let notifications = [...INITIAL_NOTIFICATIONS];
let leaderboard = [...INITIAL_LEADERBOARD];
let feedbacks = [...INITIAL_FEEDBACK];

let students: Student[] = [
  { id: "stud-1", name: "Ananya Sharma", email: "student@eduguide.com", progress: 75, joinedDate: "2026-03-01" },
  { id: "stud-2", name: "Vikram Joshi", email: "vikram@example.com", progress: 62, joinedDate: "2026-03-10" },
  { id: "stud-3", name: "Siddharth Nair", email: "sid@example.com", progress: 48, joinedDate: "2026-04-01" }
];

let scores: ScoreRecord[] = [
  { id: "scr-1", studentId: "stud-1", studentName: "Ananya Sharma", testId: "test-dsa", testTitle: "DSA Foundation Challenge", score: 20, totalQuestions: 3, correctAnswers: 2, percentage: 66.6, attemptDate: "2026-05-24" }
];

let bookmarks: Bookmark[] = [];

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': "aistudio-build",
      }
    }
  });
}

// REST API Endpoints

// 1. Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password are required" });
  }

  if (role === "admin") {
    if (email === "admin@eduguide.com" && password === "admin123") {
      return res.json({
        user: { id: "admin-1", name: "System Admin", email: "admin@eduguide.com", role: "admin" },
        token: "mock-admin-token"
      });
    }
    return res.status(401).json({ message: "Invalid Admin Credentials" });
  } else {
    // Check if standard student
    const existing = students.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.json({
        user: { ...existing, role: "student" },
        token: "mock-student-token"
      });
    }
    // Auto-create for demo convenience instead of locking them out
    if (password === "student123" || email === "student@eduguide.com") {
      const defaultStudent = { id: "stud-1", name: "Ananya Sharma", email: "student@eduguide.com", progress: 75, joinedDate: "2026-03-01", role: "student" };
      return res.json({ user: defaultStudent, token: "mock-student-token" });
    }
    
    // Register-on-the-fly or return error
    return res.status(401).json({ message: "Student account not found. Please Register first." });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existing = students.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ message: "Email is already registered" });
  }

  const newStudent: Student = {
    id: `stud-${Date.now()}`,
    name,
    email,
    progress: 0,
    joinedDate: new Date().toISOString().split('T')[0]
  };

  students.push(newStudent);
  res.status(201).json({
    user: { ...newStudent, role: "student" },
    message: "Registration successful!"
  });
});

// Reset Password Mock
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  const exists = students.some(s => s.email.toLowerCase() === email.toLowerCase());
  if (!exists && email.toLowerCase() !== "admin@eduguide.com") {
    return res.status(404).json({ message: "Specified Email ID is not registered." });
  }
  res.json({ message: "Password reset instructions have been dispatched to your email address." });
});

// 2. Data Retrieval API
app.get("/api/subjects", (req, res) => res.json(subjects));
app.get("/api/topics", (req, res) => res.json(topics));
app.get("/api/papers", (req, res) => res.json(papers));
app.get("/api/materials", (req, res) => res.json(materials));
app.get("/api/mocktests", (req, res) => res.json(mockTests));
app.get("/api/notifications", (req, res) => res.json(notifications));
app.get("/api/leaderboard", (req, res) => res.json(leaderboard));
app.get("/api/feedback", (req, res) => res.json(feedbacks));
app.get("/api/students", (req, res) => res.json(students));
app.get("/api/scores", (req, res) => res.json(scores));
app.get("/api/bookmarks/:studentId", (req, res) => {
  const { studentId } = req.params;
  res.json(bookmarks.filter(b => b.studentId === studentId));
});

// Bookmarking Action
app.post("/api/bookmarks", (req, res) => {
  const { studentId, questionId, questionText, testTitle } = req.body;
  const exists = bookmarks.find(b => b.studentId === studentId && b.questionId === questionId);
  if (exists) {
    bookmarks = bookmarks.filter(b => b.id !== exists.id);
    return res.json({ bookmarked: false, message: "Bookmark removed successfully." });
  }
  const newB: Bookmark = {
    id: `bm-${Date.now()}`,
    studentId,
    questionId,
    questionText,
    testTitle,
    savedAt: new Date().toISOString().split('T')[0]
  };
  bookmarks.push(newB);
  res.json({ bookmarked: true, bookmark: newB, message: "Question bookmarked successfully!" });
});

// Attempt mock test submission
app.post("/api/scores", (req, res) => {
  const { studentId, studentName, testId, testTitle, score, totalQuestions, correctAnswers } = req.body;
  const percentage = Number(((correctAnswers / totalQuestions) * 100).toFixed(1));
  const newScore: ScoreRecord = {
    id: `scr-${Date.now()}`,
    studentId,
    studentName: studentName || "Anonymous Student",
    testId,
    testTitle,
    score,
    totalQuestions,
    correctAnswers,
    percentage,
    attemptDate: new Date().toISOString().split('T')[0]
  };
  scores.push(newScore);

  // Auto update student progress indicator
  const stud = students.find(s => s.id === studentId);
  if (stud) {
    stud.progress = Math.min(stud.progress + 15, 100);
  }

  // Update leaderboard dynamic points
  const leaderIdx = leaderboard.findIndex(l => l.name === studentName);
  if (leaderIdx !== -1) {
    leaderboard[leaderIdx].points += correctAnswers * 10;
    leaderboard[leaderIdx].testsAttempted += 1;
    leaderboard[leaderIdx].accuracy = Math.round((leaderboard[leaderIdx].accuracy + percentage) / 2);
  } else {
    leaderboard.push({
      rank: leaderboard.length + 1,
      name: studentName,
      points: correctAnswers * 10,
      testsAttempted: 1,
      accuracy: Math.round(percentage)
    });
  }
  // Sort leaderboard
  leaderboard.sort((a, b) => b.points - a.points);
  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  res.json({ score: newScore, message: "Mock test score submitted successfully!" });
});

// Register Feedback
app.post("/api/feedback", (req, res) => {
  const { studentName, email, message, rating } = req.body;
  if (!studentName || !message || !rating) {
    return res.status(400).json({ message: "Name, message and rating are required." });
  }
  const newFb: Feedback = {
    id: `fb-${Date.now()}`,
    studentName,
    email: email || "anonymous@example.com",
    message,
    rating,
    date: new Date().toISOString().split('T')[0]
  };
  feedbacks.unshift(newFb);
  res.json({ feedback: newFb, message: "Thank you for supporting EduGuide! Real-time review registered." });
});

// 3. Admin Control / CRUD APIs

// Subject Operations
app.post("/api/admin/subjects", (req, res) => {
  const { name, code, description } = req.body;
  const newSub: Subject = {
    id: `sub-${Date.now()}`,
    name,
    code,
    description,
    topicsCount: 0
  };
  subjects.push(newSub);
  res.status(201).json(newSub);
});

app.delete("/api/admin/subjects/:id", (req, res) => {
  subjects = subjects.filter(s => s.id !== req.params.id);
  topics = topics.filter(t => t.subjectId !== req.params.id);
  res.json({ success: true, message: "Subject and related topics removed." });
});

// Topic Operations
app.post("/api/admin/topics", (req, res) => {
  const { subjectId, name, description } = req.body;
  const sub = subjects.find(s => s.id === subjectId);
  if (!sub) return res.status(404).json({ message: "Subject not found" });

  const newTopic: Topic = {
    id: `top-${Date.now()}`,
    subjectId,
    name,
    description,
    sequenceOrder: sub.topicsCount + 1
  };
  topics.push(newTopic);
  sub.topicsCount += 1;
  res.status(201).json(newTopic);
});

// Materials Upload Sim
app.post("/api/admin/materials", (req, res) => {
  const { subjectId, topicId, title, description, size, type, fileUrl } = req.body;
  const newMat: StudyMaterial = {
    id: `mat-${Date.now()}`,
    subjectId,
    topicId,
    title,
    description,
    fileUrl: fileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: size || "1.5 MB",
    type: type || "PDF",
    isTrending: false,
    addedDate: new Date().toISOString().split('T')[0]
  };
  materials.unshift(newMat);
  res.status(201).json(newMat);
});

app.delete("/api/admin/materials/:id", (req, res) => {
  materials = materials.filter(m => m.id !== req.params.id);
  res.json({ success: true, message: "Study material successfully purged." });
});

// Papers Upload Sim
app.post("/api/admin/papers", (req, res) => {
  const { subjectId, title, year, size } = req.body;
  const newPaper: QuestionPaper = {
    id: `paper-${Date.now()}`,
    subjectId,
    title,
    year: Number(year) || 2026,
    downloadUrl: "#",
    fileSize: size || "1.1 MB",
    addedDate: new Date().toISOString().split('T')[0]
  };
  papers.unshift(newPaper);
  res.status(201).json(newPaper);
});

app.delete("/api/admin/papers/:id", (req, res) => {
  papers = papers.filter(p => p.id !== req.params.id);
  res.json({ success: true, message: "Question paper successfully removed." });
});

// Mock Test Operations
app.post("/api/admin/mocktests", (req, res) => {
  const { subjectId, title, durationMinutes, questions } = req.body;
  const newTest: MockTest = {
    id: `test-${Date.now()}`,
    subjectId,
    title,
    durationMinutes: Number(durationMinutes) || 12,
    questions: questions || [],
    totalMarks: (questions?.length || 0) * 10
  };
  mockTests.push(newTest);
  res.status(201).json(newTest);
});

app.delete("/api/admin/mocktests/:id", (req, res) => {
  mockTests = mockTests.filter(t => t.id !== req.params.id);
  res.json({ success: true, message: "Mock test is successfully deleted." });
});

// Student purger
app.delete("/api/admin/students/:id", (req, res) => {
  students = students.filter(s => s.id !== req.params.id);
  res.json({ success: true, message: "Student account successfully terminated." });
});

// Notification Dispatch
app.post("/api/admin/notifications", (req, res) => {
  const { title, message, type } = req.body;
  const newNot: Notification = {
    id: `not-${Date.now()}`,
    title,
    message,
    type: type || 'info', 
    date: new Date().toISOString().split('T')[0]
  };
  notifications.unshift(newNot);
  res.status(201).json(newNot);
});

// 4. Gemini AI Recommended Study materials Engine
app.post("/api/gemini/recommend", async (req, res) => {
  const { studentName, progress, selectedSubject, bookmarksCount, recentAccuracy } = req.body;
  
  if (!ai) {
    // Generate simulated guidelines if Gemini is not setup/API key is missing 
    return res.json({
      recommendations: `### 🤖 EduGuide AI Recommendation Engine (Offline Mode)

Hello **${studentName}**! To unlock hyper-targeted, real-time custom syllabus suggestions, connect your system's **Gemini API Key** in settings. 

Based on your profile, here is a structured roadmap:
- **Current Mastery**: Your progress is at **${progress}%**. Focus on areas with complex analysis.
- **Subject Focus**: For **${selectedSubject || 'Core Engineering'}**, make sure to practice our mock exams.
- **Accuracy Path**: You currently have **${recentAccuracy || '85'}%** correctness.
- **Next Practice Step**: Re-run the mock sessions for subjects with multi-degree nodes. Keep study guides closely referenced.`
    });
  }

  try {
    const prompt = `You are the EduGuide Career & Board Exam Recommender.
Provide an elegant, structured preparation study plan in professional markdown format.
Student Details:
- Name: ${studentName}
- Database/Topic Prep Progress: ${progress}%
- Focused Subject Field: ${selectedSubject || "Data Structures and DBMS"}
- Important Bookmarks Count: ${bookmarksCount || 0}
- Current Assessment Test Accuracy: ${recentAccuracy || 80}%

Instructions:
1. Greet the student warmly.
2. Outline 3 targeted learning items for their specified subject.
3. Suggest a mock test strategy.
4. Keep the suggestions short, scannable, motivating and strictly under 250 words.
Do not use technical system variables in your answer. Limit the output to clean markdown text format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({ recommendations: response.text });
  } catch (error: any) {
    console.error("Gemini api error:", error);
    res.status(500).json({ 
      error: "Could not fetch recommendations", 
      recommendations: `### ⚠️ AI Engine Offline
      Could not query Gemini API. Please make sure the API key is running fine.` 
    });
  }
});


// Vite Dev Server Middleware or Production Dist Routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched on port ${PORT}`);
  });
}

startServer();
