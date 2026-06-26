const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const { GoogleGenAI } = require("@google/genai");
const User = require("./models/User");
const authRoutes = require("./routes/auth");
const Resume  = require("./models/Resume");
const path = require("path");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

connectDB();
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL  // add your Vercel URL here in .env
  ],
  credentials: true
}));
app.use(express.json());


app.use("/auth", authRoutes);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.get("/home", (req, res) => {
  res.send("AI Resume Analyzer Server Running");
});

app.post("/upload", upload.single("resume"), async (req, res) => {

  
  try {
    const filePath = req.file.path;

    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
    const resumeText = data.text;
  const prompt = `
You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter 
with 15+ years of experience evaluating resumes.

Analyze the resume below and return ONLY a valid JSON object.

STRICT OUTPUT RULES:
- Return ONLY raw JSON. No markdown. No backticks. No code blocks.
- Use ONLY straight double quotes for all JSON keys and values.
- Do NOT use smart quotes or curly apostrophes anywhere.
- Escape any apostrophes inside string values with backslash: it\\'s
- Do NOT include newlines inside string values.
- Response must be directly parseable by JSON.parse() with zero modification.

SCORING GUIDELINES:
90-100: Exceptional — strong projects, measurable impact, highly interview-ready.
80-89:  Very good — minor improvements needed.
70-79:  Good — lacks some impact or clarity.
60-69:  Average — significant improvements needed.
50-59:  Weak — missing important sections.
Below 50: Poor — major deficiencies.

EVALUATION CRITERIA: Structure, ATS Friendliness, Contact Info, Education,
Technical Skills, Projects, Work Experience, Achievements, Certifications,
Leadership, Quantified Results, Grammar, Readability, Industry Relevance.

INSTRUCTIONS:
- Be strict and objective. Only use info explicitly in the resume.
- Never assume skills or experience not mentioned.
- For weaknesses: mention specific problems, not generic advice.
- For suggestions: give specific actionable improvements.
- For missingSkills: suggest skills commonly expected for this candidate's profile.
- Generate exactly 10 technical questions, 5 project-based, 5 behavioral.
- Each question must have a detailed answer.

Resume text:
${resumeText}

Return ONLY this exact JSON structure (no extra fields, no markdown):
{
  "category": "one word: Exceptional or Good or Average or Weak or Poor",
  "atsScore": 0,
  "resumeLevel": "one sentence description",
  "summary": "detailed paragraph summary",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "missingSkills": ["skill 1", "skill 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "technicalSkillsDetected": ["skill 1", "skill 2"],
  "projectsDetected": ["project 1", "project 2"],
  "scoreBreakdown": {
    "Structure": 0,
    "ATS Friendliness": 0,
    "Technical Skills": 0,
    "Projects": 0,
    "Experience": 0,
    "Education": 0,
    "Achievements": 0,
    "Readability": 0
  },
  "interviewQuestions": {
    "technical": [
      { "question": "question text here", "answer": "detailed answer here" }
    ],
    "projectBased": [
      { "question": "question text here", "answer": "detailed answer here" }
    ],
    "behavioral": [
      { "question": "question text here", "answer": "detailed answer here" }
    ]
  }
}`

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
});

const result = response.text;

console.log(result);

const cleaned = response.text
 .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

const analysis = JSON.parse(cleaned);

res.json(analysis);

    

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error parsing resume" });
  }
});

app.get("/resume/user/:userId", async (req, res) => {
  try {
    const reports = await Resume.find({
      userId: req.params.userId
    }).sort({ uploadedAt: -1 });

    res.json(reports);

  } catch (err) {
    res.status(500).json({
      message: "Error Fetching Reports"
    });
  }
});
app.get("/special", (req, res) => {
    res.sendFile(
        path.join(__dirname, "private", "temp.html")
    );
});
app.get("/song", (req, res) => {
    res.sendFile(
        path.join(__dirname, "private", "try.mp3")
    );
});

app.listen(3400, () => {
  console.log("Server running on port 3400");
});
