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

app.use(cors());
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
    const prompt =`

   You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter with 15+ years of experience evaluating resumes as per the field of resume given.

Your task is to analyze the resume exactly as an ATS and recruiter would.

IMPORTANT RULES:

1. Be strict and objective.
2. Use only information explicitly present in the resume.
3. Do not assume skills, projects, experience, or achievements that are not mentioned.
4. Do not randomly change scores.
5. The same resume should produce nearly the same score every time.
6. Score based on resume quality, structure, clarity, technical depth, and employability.
7. Penalize vague descriptions, missing metrics, missing links, weak project explanations, and poor formatting.
8. Reward measurable achievements, strong projects, internships, leadership, certifications, and technical depth.
9. ATS score must be an integer from 0 to 100.
10. Never output markdown.
11. Return valid JSON only.

SCORING GUIDELINES

90-100:
Exceptional resume. Strong projects, measurable impact, excellent formatting, strong technical skills, highly interview-ready.

80-89:
Very good resume. Minor improvements needed.

70-79:
Good resume but lacks some impact, technical depth, optimization, or clarity.

60-69:
Average resume. Significant improvements needed.

50-59:
Weak resume. Missing important sections or strong evidence of skills.

Below 50:
Poor resume. Major deficiencies in structure, content, or technical qualifications.

EVALUATION CRITERIA

Evaluate:

- Resume Structure
- ATS Friendliness
- Contact Information
- Education
- Technical Skills
- Projects
- Work Experience
- Internships
- Achievements
- Certifications
- Leadership
- Quantified Results
- Grammar
- Readability
- Industry Relevance
- Software Engineering Readiness

For weaknesses:
- Mention specific problems.
- Do not provide generic advice.

For suggestions:
- Give actionable improvements.

for score breakdown dont give name on your own use that i hvae mentioned only and according to it give score 

For missingSkills:
- Suggest skills commonly expected for the candidate's profile.

For interviewQuestions:
Generate:
- 10 Technical Questions
- 5 Project-Based Questions
- 5 HR/Behavioral Questions
with each question also generate the answer
Resume:

${resumeText}

Return ONLY this JSON format:

{

  "category":" one word like average above avrage poor .."
  "atsScore": 0,
  "resumeLevel": "",
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "missingSkills": [],
  "suggestions": [],
  "technicalSkillsDetected": [],
  "projectsDetected": [],
  "scoreBreakdown": { 
    "Structure": 0/100,
    "ATS Friendliness": 0/100,
    "Technical Skills": 0/100,
    "Projects": 0/100,
    "Experience": 0/100,
    "Education": 0/100,
    "Achievements": 0/100,
    "Readability": 0/100
  },
  "interviewQuestions": {
    "technical": [question :"",answer:""],
    "projectBased": [question :"",answer:""],
    "behavioral": [question :"",answer:""]

  }
  }`

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
});

const result = response.text;

console.log(result);

const cleaned = response.text
  .replace(/```json/g, "")
  .replace(/```/g, "")
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