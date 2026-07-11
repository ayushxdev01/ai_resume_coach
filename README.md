<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=220&section=header&text=AI%20Resume%20Checker&fontSize=55&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=AI-Powered%20Resume%20Screening%20%26%20Parsing%20Engine&descAlignY=58&descSize=18" width="100%"/>

<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=22&pause=1000&color=2563EB&center=true&vCenter=true&width=600&lines=Semantic+Resume+Parsing;Contextual+JD+Matching;Groq-Powered+Ultra-Fast+Inference;AI-Driven+Scoring+%2B+Feedback" alt="Typing SVG" width="600" />

<br><br>

![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-000000?logo=flask&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama%20Inference-F55036)
![AWS](https://img.shields.io/badge/AWS-Deployed-FF9900?logo=amazonaws&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

<br>

**[🚀 Live Demo](https://d88rdyziae9iu.cloudfront.net/)** &nbsp;•&nbsp;
[Features](#-key-features) &nbsp;•&nbsp; [Architecture](#️-system-architecture) &nbsp;•&nbsp; [Tech Stack](#️-tech-stack--tools) &nbsp;•&nbsp; [API](#-api-endpoints-core-backend) &nbsp;•&nbsp; [Setup](#-getting-started)

</div>

---

## 📸 Demo

<div align="center">

![AI Resume Checker Screenshot](Demo.png)

**[🚀 Try it live →](https://d88rdyziae9iu.cloudfront.net/)**

</div>

---

## 🌟 Key Features

| | |
|---|---|
| 📄 **Semantic resume parsing** | Extracts structured details from unstructured PDF/Word resumes using advanced NLP techniques |
| 🎯 **Contextual JD matching** | Goes beyond keyword matching — analyzes actual depth of experience and skills against a specific job description |
| 🤖 **AI-driven scoring & feedback** | Uses Llama models to generate a compatibility score and actionable feedback |
| ⚡ **Ultra-fast inference** | Groq API integration for lightning-fast text processing and analysis generation |
| 🔌 **Developer-friendly API** | Clean, modular Flask backend, ready for integration with frontend dashboards |

---

## 🏗️ System Architecture

```
[User Interface / Postman]
       │
       ▼ (Multipart Form Data: Resume + JD)
[Flask Backend API]
       │
       ├─► [NLP Text Extraction Pipeline] ──► Cleaned Text
       │
       ▼ (Structured Prompt Construction)
[Groq API Gateway] ──► [Llama Inference Engine]
       │
       ▼ (JSON Response Generation)
[Score & Feedback Delivery Engine]
```

---

## 🛠️ Tech Stack & Tools

<div align="center">

<img src="https://skillicons.dev/icons?i=python,flask,aws,vscode,git,postman" alt="Tech Stack Icons" />

</div>

| Layer | Tech |
|---|---|
| Backend Framework | Python, Flask |
| AI & Inference | Groq API (Llama Models) |
| Text Processing | NLP techniques, PyPDF2 / pdfplumber |
| Environment & Tools | VS Code, Git, Postman |
| Deployment | AWS (EC2 / Elastic Beanstalk) |

---

## 🚀 Getting Started

<details>
<summary><b>🔽 Prerequisites</b></summary>
<br>

- Python 3.8+
- A Groq API key — get one from the [Groq Console](https://console.groq.com/)

</details>

<details>
<summary><b>🔽 Installation & Setup</b></summary>
<br>

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/ai-resume-checker.git
cd ai-resume-checker
```

**2. Create and activate a virtual environment**
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

**3. Install the dependencies**
```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

Create a `.env` file in the root directory:
```env
FLASK_APP=app.py
FLASK_ENV=development
GROQ_API_KEY=your_groq_api_key_here
```

**5. Run the application**
```bash
flask run
```

The backend API will be live at `http://127.0.0.1:5000/`.

</details>

---

## 🔌 API Endpoints (Core Backend)

### `POST /api/score-resume`

Processes a resume against a provided job description.

- **Content-Type:** `multipart/form-data`
- **Request Body:**
  - `resume`: (File) `.pdf` or `.docx` format
  - `job_description`: (Text) the text of the target role requirement

<details>
<summary><b>🔽 Example Response</b></summary>
<br>

```json
{
  "status": "success",
  "data": {
    "match_score": "84%",
    "key_alignments": ["Proficient in Python backend development", "Strong understanding of NLP architecture"],
    "skill_gaps": ["Missing explicit Docker/Containerization experience"],
    "verdict": "Highly Recommended for Interview Stage"
  }
}
```

</details>

---

## 📐 Engineering Highlights & Optimizations

- **Sub-second AI inference** — swapped standard LLM APIs for the Groq API engine, slashing token generation latency for near-instant evaluation
- **Prompt engineering** — deterministic JSON-structured prompt template enforces consistent parsing and eliminates LLM hallucination in scoring
- **Text normalization** — regex-based NLP pipelines strip noise, headers, and invalid encodings from PDF streams before tokenization, cutting token costs by ~25%

---

## 🗺 Future Roadmap

- [ ] Build a responsive frontend dashboard using HTML5/Tailwind CSS
- [ ] Implement batch resume processing with an asynchronous task queue (Celery/Redis)
- [ ] Containerize the full stack using Docker for seamless multi-environment deployment
- [x] Deploy live via AWS infrastructure

---

<div align="center">

## 👤 Developed by

**[Ayush Gupta](https://github.com/ayushxdev01)**

[![GitHub](https://img.shields.io/badge/GitHub-ayushxdev01-181717?logo=github&logoColor=white)](https://github.com/ayushxdev01)

---
<sub>Built with ❤️ using Python, Flask & Groq</sub>

</div>
