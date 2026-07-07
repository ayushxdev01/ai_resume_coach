import { useState, useEffect, useRef, useCallback } from 'react';

/* ─────────────────────────────────────────────
    GLOBAL STYLES (injected via <style>)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
:root {
  --bg: #0f0f13;
  --bg2: #16161d;
  --bg3: #1e1e28;
  --border: rgba(255,255,255,0.08);
  --border-hover: rgba(255,255,255,0.15);
  --text: #f0eff4;
  --text2: #9b99a8;
  --text3: #5c5a6a;
  --accent: #7c6af7;
  --accent2: #5b4fd4;
  --green: #2ecc8a;
  --green-bg: rgba(46,204,138,0.08);
  --red: #f05a5a;
  --red-bg: rgba(240,90,90,0.08);
  --amber: #f0b429;
  --amber-bg: rgba(240,180,41,0.08);
  --radius: 12px;
  --radius-sm: 8px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root {
  height: 100%; width: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 3px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes scoreRing {
  from { stroke-dashoffset: 314; }
}
@keyframes slideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 600px; }
}
@keyframes toastIn {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

/* ─────────────────────────────────────────────
    PROMPTS
───────────────────────────────────────────── */
const SYSTEM_PROMPT = (resumeText) => `You are an expert AI Resume & Interview Coach with 15+ years of experience in talent acquisition, career coaching, and technical hiring at top-tier companies including FAANG, startups, and consulting firms.

Your job is to help the user:
1. Deeply analyze their resume for strengths, weaknesses, ATS compatibility, and impact
2. Generate targeted interview questions based on their resume and target role
3. Conduct realistic mock interviews and evaluate their answers
4. Give specific, actionable improvement suggestions

IMPORTANT RULES:
- Always reference SPECIFIC content from the resume below
- Never make up skills, roles, or experience not in the resume
- Use clear sections with headers for readability
- Be honest and constructive — not generic

RESUME CONTENT:
${resumeText}`;

const ANALYZE_PROMPT = `Analyze my resume thoroughly. Structure your response EXACTLY as follows:

SCORE: [number]/10
VERDICT: [one sentence]

STRENGTHS:
- [strength 1 tied to specific resume content]
- [strength 2]
- [strength 3]

WEAKNESSES:
- [weakness 1]
- [weakness 2]
- [weakness 3]

ATS COMPATIBILITY:
[2-3 sentences on ATS score and missing keywords]

IMPACT ASSESSMENT:
[Examples of weak lines and improved rewrites]

TOP 3 PRIORITY IMPROVEMENTS:
1. [most impactful change]
2. [second change]
3. [third change]

Be specific, reference actual resume content. Be honest.`;

const QUESTIONS_PROMPT = (targetRole) => `Generate interview questions for me${targetRole ? ` targeting the role: ${targetRole}` : ''}.

Format EXACTLY as:

BEHAVIORAL QUESTIONS:
1. [question] | TESTING: [what interviewer is testing]
2. [question] | TESTING: [what]
3. [question] | TESTING: [what]
4. [question] | TESTING: [what]
5. [question] | TESTING: [what]

TECHNICAL QUESTIONS:
1. [question] | TESTING: [what]
2. [question] | TESTING: [what]
3. [question] | TESTING: [what]
4. [question] | TESTING: [what]
5. [question] | TESTING: [what]

SITUATIONAL QUESTIONS:
1. [question] | TESTING: [what]
2. [question] | TESTING: [what]
3. [question] | TESTING: [what]

RESUME DEEP-DIVE QUESTIONS:
1. [question] | TESTING: [what]
2. [question] | TESTING: [what]
3. [question] | TESTING: [what]
4. [question] | TESTING: [what]

CULTURE FIT QUESTIONS:
1. [question] | TESTING: [what]
2. [question] | TESTING: [what]
3. [question] | TESTING: [what]

Base every question on actual content in my resume.`;

const INTERVIEW_START_PROMPT = `You are now conducting a mock interview.

RULES:
- Ask ONE question at a time
- After each answer, respond with:
  SCORE: [X]/10
  STRENGTHS: [what worked]
  GAPS: [what was missing]
  IDEAL STRUCTURE: [brief outline of ideal answer]
  TIP: [one actionable tip]

  Then ask: "Ready for the next question?"
- Ask exactly 5 questions total, then give an OVERALL PERFORMANCE SUMMARY
- Base questions on the resume content

Start now with your first question.`;

const IMPROVE_PROMPT = `Rewrite the 6 weakest parts of my resume. For each one, format EXACTLY as:

IMPROVEMENT 1:
ORIGINAL: [quote the exact original text]
IMPROVED: [your rewritten version]
REASON: [why this is stronger — keywords, quantification, clarity]

IMPROVEMENT 2:
ORIGINAL: [exact original]
IMPROVED: [rewrite]
REASON: [explanation]

[continue for all 6]

Focus on: weak bullet points, vague verbs, missing numbers/metrics, poor ATS keywords.`;

const TAILOR_PROMPT = (jobDescription) => `I want to tailor my resume for this job:

JOB DESCRIPTION:
${jobDescription}

Respond with:

MATCH SCORE: [X]%
MATCH SUMMARY: [2 sentences]

MISSING KEYWORDS:
- [keyword 1]
- [keyword 2]
- [etc]

EXPERIENCE GAPS:
- [gap 1]
- [gap 2]

TAILORING RECOMMENDATIONS:
1. [specific change to make]
2. [specific change]
3. [specific change]
4. [specific change]

COVER LETTER HOOK:
[2 strong opening sentences for a cover letter targeting this role]`;

/* ─────────────────────────────────────────────
   PARSING HELPERS
───────────────────────────────────────────── */
function stripMarkdown(text) {
  return text
    .replace(/\*{1,3}/g, '')       
    .replace(/#{1,6}\s*/g, '')     
    .replace(/`/g, '')             
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); 
}

function parseScore(text) {
  const clean = stripMarkdown(text);
  const m1 = clean.match(/SCORE:\s*(\d+)\s*\/\s*10/i);
  if (m1) return parseInt(m1[1]);
  const m2 = clean.match(/SCORE:\s*(\d+)\s*out\s*of\s*10/i);
  if (m2) return parseInt(m2[1]);
  const m3 = clean.slice(0, 500).match(/(\d+)\s*\/\s*10/);
  if (m3) return parseInt(m3[1]);
  return null;
}

function parseVerdict(text) {
  const clean = stripMarkdown(text);
  const match = clean.match(/VERDICT:\s*(.+)/i);
  return match ? match[1].trim() : '';
}

function parseSection(text, sectionName, nextSections) {
  const clean = stripMarkdown(text);
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nextPart = nextSections.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`${escapedName}[:\\s]*\\n([\\s\\S]*?)(?=${nextPart}|$)`, 'i');
  const match = clean.match(regex);
  if (match) {
    return match[1].trim().split('\n').filter(l => l.trim()).map(l => l.replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean);
  }
  return [];
}

function parseImprovements(text) {
  const blocks = text.split(/IMPROVEMENT \d+:/i).filter(Boolean);
  return blocks.map(block => {
    const original = block.match(/ORIGINAL:(.*?)(?=IMPROVED:|$)/is)?.[1]?.trim();
    const improved = block.match(/IMPROVED:(.*?)(?=REASON:|$)/is)?.[1]?.trim();
    const reason = block.match(/REASON:(.*?)(?=IMPROVEMENT \d+:|$)/is)?.[1]?.trim();
    return { original, improved, reason };
  }).filter(i => i.original && i.improved);
}

function parseQuestions(text) {
  const categories = [
    'BEHAVIORAL QUESTIONS',
    'TECHNICAL QUESTIONS',
    'SITUATIONAL QUESTIONS',
    'RESUME DEEP-DIVE QUESTIONS',
    'CULTURE FIT QUESTIONS'
  ];
  const result = {};
  categories.forEach((cat, idx) => {
    const nextCats = categories.slice(idx + 1);
    const nextPart = nextCats.length > 0
      ? nextCats.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
      : '$';
    const escapedCat = cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedCat}[:\\s]*\\n([\\s\\S]*?)(?=${nextPart}|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      result[cat] = match[1].trim().split('\n')
        .filter(l => l.match(/^\d+\./))
        .map(l => {
          const parts = l.replace(/^\d+\.\s*/, '').split(/\s*\|\s*TESTING:\s*/i);
          return { question: parts[0]?.trim(), testing: parts[1]?.trim() || '' };
        });
    }
  });
  return result;
}

/* ─────────────────────────────────────────────
   API FUNCTION (Groq — free, fast, Llama 3.3 70B)
───────────────────────────────────────────── */
async function callAI(apiKey, systemPrompt, messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'API request failed');
  return data.choices[0].message.content;
}

/* ─────────────────────────────────────────────
   SMALL UI COMPONENTS
───────────────────────────────────────────── */
function Spinner({ size = 20, color }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid rgba(255,255,255,0.15)`,
      borderTop: `2px solid ${color || 'var(--accent)'}`,
      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      verticalAlign: 'middle'
    }} />
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--green)', color: '#000', padding: '10px 24px',
      borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 14,
      animation: 'toastIn 0.3s ease', zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      {message}
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--red-bg)', border: '1px solid var(--red)',
      color: 'var(--red)', padding: '12px 24px', borderRadius: 'var(--radius)',
      fontSize: 14, zIndex: 9999, maxWidth: 500, animation: 'fadeIn 0.3s ease',
      display: 'flex', alignItems: 'center', gap: 12
    }}>
      <span style={{ flex: 1 }}>⚠ {message}</span>
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', color: 'var(--red)',
        cursor: 'pointer', fontSize: 18, lineHeight: 1
      }}>✖</button>
    </div>
  );
}

function ScoreRing({ score, size = 140 }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const pct = (score || 0) / 10;
  const dashOffset = circumference * (1 - pct);
  const color = score <= 4 ? 'var(--red)' : score <= 7 ? 'var(--amber)' : 'var(--green)';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border)"
          strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: 36, fontWeight: 800, color }}>{score ?? '–'}</span>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>/10</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'analysis', label: 'Analysis', icon: '📈' },
  { id: 'questions', label: 'Questions', icon: '✔' },
  { id: 'interview', label: 'Interview', icon: '🎯' },
  { id: 'improve', label: 'Improve', icon: '✿' },
];

function Navbar({ currentScreen, setCurrentScreen, hasResume }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 60,
      background: 'rgba(15,15,19,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)', display: 'flex',
      alignItems: 'center', padding: '0 24px', zIndex: 1000,
      justifyContent: 'space-between'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer'
      }} onClick={() => setCurrentScreen('upload')}>
        <span style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16
        }}>🚀</span>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
          ResumeAI
        </span>
      </div>

      {hasResume && (
        <div style={{ display: 'flex', gap: 4 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setCurrentScreen(item.id)}
              style={{
                background: currentScreen === item.id
                  ? 'rgba(124,106,247,0.15)' : 'transparent',
                border: currentScreen === item.id
                  ? '1px solid rgba(124,106,247,0.3)' : '1px solid transparent',
                color: currentScreen === item.id ? 'var(--accent)' : 'var(--text2)',
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s ease', fontFamily: 'inherit'
              }}>
              <span>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 1: UPLOAD
───────────────────────────────────────────── */
function UploadScreen({ onAnalyze, loading, resumeText, setResumeText, fileName, setFileName, apiKey, setApiKey }) {
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setFileName(file.name);
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      setResumeText(text);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        const arrayBuf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          fullText += tc.items.map(item => item.str).join(' ') + '\n';
        }
        setResumeText(fullText.trim());
      } catch (e) {
        console.error('PDF parse error:', e);
        setResumeText('');
        setFileName('');
        alert('Failed to parse PDF. Please try a .txt file.');
      }
    }
  }, [setResumeText, setFileName]);

  const handleDrop = (e) => {
    e.preventDefault(); setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 20px 40px', animation: 'fadeUp 0.5s ease'
    }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%', margin: '0 auto 32px',
          background: 'radial-gradient(circle, rgba(124,106,247,0.25) 0%, transparent 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48
        }}>🚀</div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800,
          letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16,
          background: 'linear-gradient(135deg, var(--text) 30%, var(--accent) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Land your dream job.
        </h1>
        <p style={{
          fontSize: 16, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 36, maxWidth: 440,
          margin: '0 auto 36px'
        }}>
          Upload your resume. Get brutally honest feedback, interview prep, and a rewrite — powered by AI.
        </p>

        {/* Dynamic API Key Input Box Wrapper */}
        <div style={{ marginBottom: 24, textAlign: 'left' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '0 16px',
            transition: 'border-color 0.2s'
          }}>
            <span style={{ fontSize: 16, opacity: 0.5 }}>🔑</span>
            <input
              type="password"
              placeholder="Enter your Groq API key"
              value={apiKey}
              onChange={e => {
                const currentKey = e.target.value.trim();
                setApiKey(currentKey);
                // Dynamically commit valid token strings right into client memory
                if (currentKey.startsWith('gsk_')) {
                  localStorage.setItem('groq_api_key', currentKey);
                }
              }}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: 'var(--text)', padding: '14px 0', fontSize: 14,
                outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
            Don't have an API Key? <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>Click here to grab your free Groq Key ↗</a> · Saved locally in your browser workspace.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', padding: '48px 24px',
            cursor: 'pointer', transition: 'all 0.3s ease',
            background: dragActive ? 'rgba(124,106,247,0.06)' : 'var(--bg2)',
            marginBottom: 24
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf,.txt"
            onChange={e => handleFile(e.target.files[0])}
            style={{ display: 'none' }} />

          {resumeText ? (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--green-bg)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', fontSize: 22
              }}>✔</div>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{fileName}</p>
              <p style={{ color: 'var(--green)', fontSize: 13, marginTop: 4 }}>
                Resume loaded · {resumeText.split(/\s+/).length} words
              </p>
            </div>
          ) : (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(124,106,247,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', fontSize: 22
              }}>📄</div>
              <p style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>
                Drag & drop your resume here
              </p>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>
                Supports PDF and TXT files
              </p>
            </>
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={onAnalyze}
          disabled={!resumeText || loading || !apiKey}
          style={{
            width: '100%', padding: '16px 24px',
            background: (!resumeText || !apiKey)
              ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: (!resumeText || !apiKey) ? 'var(--text3)' : '#fff',
            border: 'none', borderRadius: 'var(--radius)',
            fontSize: 16, fontWeight: 700, cursor: (!resumeText || !apiKey) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease', fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1,
            boxShadow: (resumeText && apiKey) ? '0 4px 24px rgba(124,106,247,0.3)' : 'none'
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Spinner size={18} color="#fff" /> Analyzing your resume...
            </span>
          ) : 'Analyze My Resume →'}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2: ANALYSIS
───────────────────────────────────────────── */
function AnalysisScreen({ analysisText, onGenQuestions, onStartInterview, onImprove, onTailor,
  loadingQ, loadingI, loadingImp }) {
  const [activeTab, setActiveTab] = useState(0);
  const score = parseScore(analysisText);
  const verdict = parseVerdict(analysisText);

  const strengths = parseSection(analysisText, 'STRENGTHS',
    ['WEAKNESSES', 'ATS COMPATIBILITY', 'IMPACT ASSESSMENT', 'TOP 3']);
  const weaknesses = parseSection(analysisText, 'WEAKNESSES',
    ['ATS COMPATIBILITY', 'IMPACT ASSESSMENT', 'TOP 3']);
  const ats = parseSection(analysisText, 'ATS COMPATIBILITY',
    ['IMPACT ASSESSMENT', 'TOP 3']);
  const fixes = parseSection(analysisText, 'TOP 3 PRIORITY IMPROVEMENTS', []);

  const tabs = [
    { label: 'Strengths', color: 'var(--green)', bg: 'var(--green-bg)', items: strengths },
    { label: 'Weaknesses', color: 'var(--red)', bg: 'var(--red-bg)', items: weaknesses },
    { label: 'ATS Score', color: 'var(--amber)', bg: 'var(--amber-bg)', items: ats },
    { label: 'Priority Fixes', color: 'var(--accent)', bg: 'rgba(124,106,247,0.08)', items: fixes },
  ];

  return (
    <div style={{
      minHeight: '100vh', padding: '80px 24px 40px',
      maxWidth: 1100, margin: '0 auto', animation: 'fadeUp 0.5s ease'
    }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>
        Resume Analysis
      </h2>
      <p style={{ color: 'var(--text2)', marginBottom: 32, fontSize: 14 }}>
        Here's what our AI coach found in your resume.
      </p>

      <div className="analysis-grid" style={{
        display: 'grid', gridTemplateColumns: '280px 1fr',
        gap: 24, marginBottom: 32
      }}>
        {/* Left: Score */}
        <div style={{
          background: 'var(--bg2)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', padding: 32,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 16
        }}>
          <h3 style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>
            Resume Score
          </h3>
          <ScoreRing score={score} />
          <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.5 }}>
            {verdict || 'Analysis complete'}
          </p>
        </div>

        {/* Right: Tabs */}
        <div style={{
          background: 'var(--bg2)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', overflow: 'hidden'
        }}>
          {/* Tab headers */}
          <div style={{
            display: 'flex', borderBottom: '1px solid var(--border)',
            overflow: 'auto'
          }}>
            {tabs.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                style={{
                  flex: 1, padding: '14px 16px', background: 'transparent',
                  border: 'none', borderBottom: activeTab === i
                    ? `2px solid ${tab.color}` : '2px solid transparent',
                  color: activeTab === i ? tab.color : 'var(--text3)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'inherit', whiteSpace: 'nowrap'
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 20, minHeight: 200 }}>
            {tabs[activeTab].items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeIn 0.3s' }}>
                {tabs[activeTab].items.map((item, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', background: tabs[activeTab].bg,
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${tabs[activeTab].color}`,
                    fontSize: 14, lineHeight: 1.6, color: 'var(--text)'
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: 24, color: 'var(--text3)', fontSize: 14,
                whiteSpace: 'pre-wrap', lineHeight: 1.7
              }}>
                {analysisText}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12
      }}>
        {[
          { label: 'Interview Questions', icon: '✔', onClick: onGenQuestions, loading: loadingQ },
          { label: 'Mock Interview', icon: '🎯', onClick: onStartInterview, loading: loadingI },
          { label: 'Improve Resume', icon: '✿', onClick: onImprove, loading: loadingImp },
          { label: 'Tailor for a Job', icon: '🎻', onClick: onTailor, loading: false },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} disabled={btn.loading}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '18px 12px',
              color: 'var(--text)', cursor: 'pointer', textAlign: 'center',
              transition: 'all 0.2s', fontFamily: 'inherit',
              opacity: btn.loading ? 0.6 : 1
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)'; }}
          >
            <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>{btn.icon}</span>
            {btn.loading ? <Spinner size={16} /> : (
              <span style={{ fontSize: 13, fontWeight: 600 }}>{btn.label}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 3: QUESTIONS
───────────────────────────────────────────── */
function QuestionsScreen({ questionsText, onRegenerate, onPractice, loading }) {
  const [expanded, setExpanded] = useState({});
  const [expandedQ, setExpandedQ] = useState({});
  const [role, setRole] = useState('');
  const parsed = parseQuestions(questionsText);
  const categories = Object.keys(parsed);

  const categoryIcons = {
    'BEHAVIORAL QUESTIONS': '🧠',
    'TECHNICAL QUESTIONS': '⚙️',
    'SITUATIONAL QUESTIONS': '🏃',
    'RESUME DEEP-DIVE QUESTIONS': '🔎',
    'CULTURE FIT QUESTIONS': '🌍'
  };

  const toggleCat = (cat) => setExpanded(p => ({ ...p, [cat]: !p[cat] }));
  const toggleQ = (key) => setExpandedQ(p => ({ ...p, [key]: !p[key] }));

  return (
    <div style={{
      minHeight: '100vh', padding: '80px 24px 40px',
      maxWidth: 800, margin: '0 auto', animation: 'fadeUp 0.5s ease'
    }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>
        Interview Questions
      </h2>
      <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>
        Tailored questions based on your resume content.
      </p>

      {/* Role filter */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center'
      }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '0 14px'
        }}>
          <span style={{ fontSize: 14, opacity: 0.5 }}>🎻</span>
          <input
            placeholder="Target role (e.g. Senior Frontend Engineer)"
            value={role} onChange={e => setRole(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: 'var(--text)', padding: '12px 10px', fontSize: 14,
              outline: 'none', fontFamily: 'inherit'
            }}
          />
        </div>
        <button onClick={() => onRegenerate(role)} disabled={loading}
          style={{
            background: 'var(--accent)', border: 'none',
            color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
            opacity: loading ? 0.6 : 1
          }}>
          {loading ? <Spinner size={14} color="#fff" /> : 'Regenerate'}
        </button>
      </div>

      {/* Categories */}
      {categories.length > 0 ? categories.map(cat => (
        <div key={cat} style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', marginBottom: 12, overflow: 'hidden'
        }}>
          <button onClick={() => toggleCat(cat)} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            padding: '16px 20px', background: 'transparent', border: 'none',
            color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit',
            justifyContent: 'space-between'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{categoryIcons[cat] || '📏'}</span>
              <span style={{ fontWeight: 600, fontSize: 15 }}>
                {cat.replace('QUESTIONS', '').trim()}
              </span>
              <span style={{
                background: 'rgba(124,106,247,0.15)', color: 'var(--accent)',
                padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600
              }}>
                {parsed[cat]?.length || 0}
              </span>
            </span>
            <span style={{
              transform: expanded[cat] ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s', fontSize: 12, color: 'var(--text3)'
            }}>▼</span>
          </button>

          {expanded[cat] && (
            <div style={{ padding: '0 20px 16px', animation: 'fadeIn 0.2s' }}>
              {parsed[cat]?.map((q, i) => {
                const qKey = `${cat}-${i}`;
                return (
                  <div key={i} style={{
                    padding: '14px 0', borderTop: '1px solid var(--border)'
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', gap: 12
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: 14, fontWeight: 500, lineHeight: 1.5,
                          cursor: 'pointer'
                        }} onClick={() => toggleQ(qKey)}>
                          <span style={{ color: 'var(--text3)', marginRight: 8 }}>{i + 1}.</span>
                          {q.question}
                        </p>
                        {expandedQ[qKey] && q.testing && (
                          <p style={{
                            fontSize: 13, color: 'var(--amber)', marginTop: 8,
                            padding: '10px 14px', background: 'var(--amber-bg)',
                            borderRadius: 'var(--radius-sm)', animation: 'fadeIn 0.2s'
                          }}>
                            <strong>Testing:</strong> {q.testing}
                          </p>
                        )}
                      </div>
                      <button onClick={() => onPractice(q.question)}
                        style={{
                          background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)',
                          color: 'var(--accent)', padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)', fontSize: 12,
                          fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                          fontFamily: 'inherit'
                        }}>
                        Practice →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )) : (
        <div style={{
          background: 'var(--bg2)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', padding: 24,
          whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7,
          color: 'var(--text2)'
        }}>
          {questionsText}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 4: MOCK INTERVIEW
───────────────────────────────────────────── */
function InterviewScreen({ apiKey, resumeText, practiceQuestion }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewDone, setInterviewDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const chatRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const startInterview = useCallback(async () => {
    if (started) return;
    setStarted(true);
    setLoading(true);
    try {
      const prompt = practiceQuestion
        ? `Start the mock interview with this specific question: "${practiceQuestion}". Then continue with 4 more questions.`
        : INTERVIEW_START_PROMPT;
      const result = await callAI(apiKey, SYSTEM_PROMPT(resumeText), [
        { role: 'user', content: prompt }
      ]);
      setMessages([
        { role: 'user', content: prompt, hidden: true },
        { role: 'assistant', content: result }
      ]);
    } catch (e) {
      setMessages([{ role: 'assistant', content: 'Failed to start interview. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [apiKey, resumeText, practiceQuestion, started]);

  useEffect(() => { startInterview(); }, [startInterview]);

  const sendMessage = async () => {
    if (!userInput.trim() || loading || interviewDone) return;
    const newMessages = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setLoading(true);
    try {
      const apiMessages = newMessages.filter(m => !m.hidden).map(m => ({
        role: m.role, content: m.content
      }));
      const result = await callAI(apiKey, SYSTEM_PROMPT(resumeText), apiMessages);
      const newCount = questionCount + 1;
      setQuestionCount(newCount);
      setMessages(prev => [...prev, { role: 'assistant', content: result }]);
      if (newCount >= 5 || result.toLowerCase().includes('overall performance summary')) {
        setInterviewDone(true);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant', content: 'Something went wrong. Please try sending again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const extractScoreBadge = (text) => {
    const match = text.match(/SCORE:\s*(\d+)\/10/i);
    return match ? match[1] : null;
  };

  const formatMessageContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.match(/^(SCORE|STRENGTHS|GAPS|IDEAL STRUCTURE|TIP|OVERALL PERFORMANCE):/i)) {
        const [label, ...rest] = trimmed.split(':');
        return (
          <div key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>
            <span style={{
              fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
              color: 'var(--accent)', letterSpacing: 0.5
            }}>{label}:</span>
            <span style={{ marginLeft: 4 }}>{rest.join(':')}</span>
          </div>
        );
      }
      return <div key={i} style={{ marginTop: i > 0 ? 2 : 0 }}>{line}</div>;
    });
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      paddingTop: 60, animation: 'fadeUp 0.4s ease'
    }}>
      {/* Progress bar */}
      <div style={{
        padding: '12px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg2)'
      }}>
        <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
          {interviewDone ? '✅ Interview Complete' : `Question ${Math.min(questionCount + 1, 5)} of 5`}
        </span>
        <div style={{
          flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', width: `${(Math.min(questionCount, 5) / 5) * 100}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--green))',
            borderRadius: 2, transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Chat messages */}
      <div ref={chatRef} style={{
        flex: 1, overflowY: 'auto', padding: 24, display: 'flex',
        flexDirection: 'column', gap: 16
      }}>
        {messages.filter(m => !m.hidden).map((msg, i) => {
          const isAI = msg.role === 'assistant';
          const scoreBadge = isAI ? extractScoreBadge(msg.content) : null;
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div className="chat-bubble" style={{
                maxWidth: '65%', padding: '14px 18px',
                background: isAI ? 'var(--bg3)' : 'var(--accent)',
                borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                fontSize: 14, lineHeight: 1.6,
                position: 'relative'
              }}>
                {scoreBadge && (
                  <span style={{
                    display: 'inline-block', padding: '2px 10px',
                    background: 'rgba(124,106,247,0.2)',
                    border: '1px solid rgba(124,106,247,0.3)',
                    borderRadius: 20, fontSize: 12, fontWeight: 700,
                    color: 'var(--accent)', marginBottom: 8
                  }}>
                    {scoreBadge}/10
                  </span>
                )}
                {isAI ? formatMessageContent(msg.content) : msg.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '14px 24px', background: 'var(--bg3)',
              borderRadius: '4px 16px 16px 16px'
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--text3)', animation: `pulse 1s ease ${i * 0.2}s infinite`
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      {!interviewDone ? (
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          background: 'var(--bg2)', display: 'flex', gap: 12, alignItems: 'flex-end'
        }}>
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer... (Ctrl+Enter to send)"
            rows={1}
            style={{
              flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px',
              color: 'var(--text)', fontSize: 14, resize: 'none',
              maxHeight: 100, outline: 'none', fontFamily: 'inherit',
              lineHeight: 1.5
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
          <button onClick={sendMessage} disabled={!userInput.trim() || loading}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              border: 'none', color: '#fff', padding: '12px 20px',
              borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600,
              cursor: (!userInput.trim() || loading) ? 'not-allowed' : 'pointer',
              opacity: (!userInput.trim() || loading) ? 0.5 : 1,
              fontFamily: 'inherit', whiteSpace: 'nowrap'
            }}>
            Send ↑
          </button>
        </div>
      ) : (
        <div style={{
          padding: '20px 24px', borderTop: '1px solid var(--border)',
          background: 'var(--bg2)', textAlign: 'center'
        }}>
          <p style={{ color: 'var(--green)', fontWeight: 600, marginBottom: 4 }}>
            🎉 Interview Complete!
          </p>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>
            Review the feedback above for your performance summary.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 5: IMPROVE
───────────────────────────────────────────── */
function ImproveScreen({ improveText }) {
  const [toast, setToast] = useState('');
  const improvements = parseImprovements(improveText);

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setToast('Copied to clipboard!');
  };

  const downloadAll = () => {
    let content = 'RESUME IMPROVEMENTS\n' + '='.repeat(50) + '\n\n';
    improvements.forEach((imp, i) => {
      content += `IMPROVEMENT ${i + 1}\n`;
      content += `ORIGINAL: ${imp.original}\n`;
      content += `IMPROVED: ${imp.improved}\n`;
      content += `REASON: ${imp.reason}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'resume-improvements.txt';
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      minHeight: '100vh', padding: '80px 24px 40px',
      maxWidth: 900, margin: '0 auto', animation: 'fadeUp 0.5s ease'
    }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>
        Resume Rewrites
      </h2>
      <p style={{ color: 'var(--text2)', marginBottom: 32, fontSize: 14 }}>
        {improvements.length} targeted improvements based on your resume.
      </p>

      {improvements.length > 0 ? improvements.map((imp, i) => (
        <div key={i} style={{
          background: 'var(--bg2)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', marginBottom: 16,
          overflow: 'hidden', animation: `fadeUp 0.4s ease ${i * 0.08}s both`
        }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: 0.5
            }}>
              Improvement {i + 1}
            </span>
            <button onClick={() => copyText(imp.improved)}
              style={{
                background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)',
                color: 'var(--accent)', padding: '4px 12px',
                borderRadius: 'var(--radius-sm)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>
              Copy improved ↑
            </button>
          </div>

          <div className="improve-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            minHeight: 80
          }}>
            <div style={{
              padding: '16px 20px', background: 'var(--red-bg)',
              borderRight: '1px solid var(--border)'
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                color: 'var(--red)', letterSpacing: 1, marginBottom: 6, display: 'block'
              }}>Before</span>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text2)' }}>
                {imp.original}
              </p>
            </div>
            <div style={{ padding: '16px 20px', background: 'var(--green-bg)' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                color: 'var(--green)', letterSpacing: 1, marginBottom: 6, display: 'block'
              }}>After</span>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>
                {imp.improved}
              </p>
            </div>
          </div>

          {imp.reason && (
            <div style={{
              padding: '14px 20px', borderTop: '1px solid var(--border)',
              fontSize: 13, color: 'var(--text2)', lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--amber)' }}>Why this is stronger:</strong>{' '}
              {imp.reason}
            </div>
          )}
        </div>
      )) : (
        <div style={{
          background: 'var(--bg2)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', padding: 24,
          whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7,
          color: 'var(--text2)'
        }}>
          {improveText}
        </div>
      )}

      {improvements.length > 0 && (
        <button onClick={downloadAll}
          style={{
            width: '100%', padding: '14px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text)',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            marginTop: 8, fontFamily: 'inherit', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          📥 Download all improvements as .txt
        </button>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAILOR MODAL
───────────────────────────────────────────── */
function TailorModal({ onClose, onSubmit, loading, tailorResult }) {
  const [jd, setJd] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!jd.trim()) return;
    onSubmit(jd);
    setSubmitted(true);
  };

  const formatTailorResult = (text) => {
    if (!text) return null;
    const matchScore = text.match(/MATCH SCORE:\s*(\d+)%/i);
    const matchSummary = text.match(/MATCH SUMMARY:\s*([\s\S]*?)(?=MISSING KEYWORDS|$)/i);

    return (
      <div style={{ animation: 'fadeIn 0.3s', maxHeight: 500, overflowY: 'auto' }}>
        {matchScore && (
          <div style={{
            textAlign: 'center', marginBottom: 20, padding: 20,
            background: 'var(--bg3)', borderRadius: 'var(--radius)'
          }}>
            <div style={{
              fontSize: 48, fontWeight: 800,
              color: parseInt(matchScore[1]) >= 70 ? 'var(--green)' :
                parseInt(matchScore[1]) >= 40 ? 'var(--amber)' : 'var(--red)'
            }}>
              {matchScore[1]}%
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Match Score</p>
            {matchSummary && (
              <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>
                {matchSummary[1].trim()}
              </p>
            )}
          </div>
        )}
        <div style={{
          whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7,
          color: 'var(--text2)'
        }}>
          {text}
        </div>
      </div>
    );
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000, padding: 24,
      animation: 'fadeIn 0.2s'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', width: '100%',
        maxWidth: 600, maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeUp 0.3s ease'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>🎻 Tailor for a Job</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            fontSize: 20, cursor: 'pointer', padding: 4
          }}>✖</button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {!submitted || !tailorResult ? (
            <>
              <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>
                Paste the job description below and we'll analyze how well your resume matches.
              </p>
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="Paste the full job description here..."
                style={{
                  width: '100%', minHeight: 200, background: 'var(--bg3)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  padding: 16, color: 'var(--text)', fontSize: 14,
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                  lineHeight: 1.6
                }}
              />
              <button onClick={handleSubmit} disabled={!jd.trim() || loading}
                style={{
                  width: '100%', marginTop: 16, padding: '14px',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  border: 'none', color: '#fff', borderRadius: 'var(--radius)',
                  fontSize: 15, fontWeight: 700, cursor: !jd.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: !jd.trim() ? 0.5 : 1
                }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Spinner size={16} color="#fff" /> Analyzing match...
                  </span>
                ) : 'Analyze Match →'}
              </button>
            </>
          ) : (
            formatTailorResult(tailorResult)
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RESPONSIVE CSS (injected as a string)
───────────────────────────────────────────── */
const RESPONSIVE_CSS = `
@media (max-width: 768px) {
  .analysis-grid { grid-template-columns: 1fr !important; }
  .action-buttons { grid-template-columns: 1fr 1fr !important; }
  .improve-grid { grid-template-columns: 1fr !important; }
  .nav-label { display: none; }
  .chat-bubble { max-width: 85% !important; }
}
`;

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('upload');
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Initialize from client memory safely on app initialization
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('groq_api_key') || '';
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Screen data
  const [analysisText, setAnalysisText] = useState('');
  const [questionsText, setQuestionsText] = useState('');
  const [improveText, setImproveText] = useState('');
  const [tailorResult, setTailorResult] = useState('');
  const [showTailor, setShowTailor] = useState(false);
  const [practiceQuestion, setPracticeQuestion] = useState('');

  // Loading states for individual actions
  const [loadingQ, setLoadingQ] = useState(false);
  const [loadingI, setLoadingI] = useState(false);
  const [loadingImp, setLoadingImp] = useState(false);
  const [loadingTailor, setLoadingTailor] = useState(false);

  const hasResume = !!resumeText;
  const sys = SYSTEM_PROMPT(resumeText);

  const handleAnalyze = async () => {
    if (!resumeText || !apiKey) return;
    setLoading(true);
    setError('');
    try {
      const result = await callAI(apiKey, sys, [{ role: 'user', content: ANALYZE_PROMPT }]);
      setAnalysisText(result);
      setCurrentScreen('analysis');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenQuestions = async (role) => {
    if (!apiKey) return;
    setLoadingQ(true); setError('');
    try {
      const result = await callAI(apiKey, sys, [{ role: 'user', content: QUESTIONS_PROMPT(role) }]);
      setQuestionsText(result);
      setCurrentScreen('questions');
    } catch (err) {
      setError(err.message || 'Failed to generate questions.');
    } finally {
      setLoadingQ(false);
    }
  };

  const handleStartInterview = () => {
    setPracticeQuestion('');
    setCurrentScreen('interview');
  };

  const handleImprove = async () => {
    if (!apiKey) return;
    setLoadingImp(true); setError('');
    try {
      const result = await callAI(apiKey, sys, [{ role: 'user', content: IMPROVE_PROMPT }]);
      setImproveText(result);
      setCurrentScreen('improve');
    } catch (err) {
      setError(err.message || 'Failed to generate improvements.');
    } finally {
      setLoadingImp(false);
    }
  };

  const handleTailor = async (jd) => {
    if (!apiKey) return;
    setLoadingTailor(true); setError('');
    try {
      const result = await callAI(apiKey, sys, [{ role: 'user', content: TAILOR_PROMPT(jd) }]);
      setTailorResult(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze job match.');
    } finally {
      setLoadingTailor(false);
    }
  };

  const handlePractice = (question) => {
    setPracticeQuestion(question);
    setCurrentScreen('interview');
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{RESPONSIVE_CSS}</style>
      <Navbar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} hasResume={hasResume} />
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {currentScreen === 'upload' && (
        <UploadScreen
          onAnalyze={handleAnalyze}
          loading={loading}
          resumeText={resumeText}
          setResumeText={setResumeText}
          fileName={fileName}
          setFileName={setFileName}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />
      )}

      {currentScreen === 'analysis' && (
        <AnalysisScreen
          analysisText={analysisText}
          onGenQuestions={() => handleGenQuestions('')}
          onStartInterview={handleStartInterview}
          onImprove={handleImprove}
          onTailor={() => { setTailorResult(''); setShowTailor(true); }}
          loadingQ={loadingQ}
          loadingI={loadingI}
          loadingImp={loadingImp}
        />
      )}

      {currentScreen === 'questions' && (
        <QuestionsScreen
          questionsText={questionsText}
          onRegenerate={(role) => handleGenQuestions(role)}
          onPractice={handlePractice}
          loading={loadingQ}
        />
      )}

      {currentScreen === 'interview' && (
        <InterviewScreen
          key={practiceQuestion + Date.now()}
          apiKey={apiKey}
          resumeText={resumeText}
          practiceQuestion={practiceQuestion}
        />
      )}

      {currentScreen === 'improve' && (
        <ImproveScreen improveText={improveText} />
      )}

      {showTailor && (
        <TailorModal
          onClose={() => setShowTailor(false)}
          onSubmit={handleTailor}
          loading={loadingTailor}
          tailorResult={tailorResult}
        />
      )}

      {/* Footer */}
      {currentScreen === 'upload' && (
        <footer style={{
          textAlign: 'center', padding: '24px 20px 32px',
          fontSize: 13, color: 'var(--text3)'
        }}>
          Built by <a href="https://github.com/ayushxdev01" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Ayush Gupta</a>
        </footer>
      )}
    </>
  );
}