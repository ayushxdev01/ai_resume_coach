```markdown
# AI Resume Screening & Parsing Engine 🚀

An advanced, AI-powered web application designed to automate resume screening, parse unstructured data, and evaluate candidate profiles against job descriptions using state-of-the-art Large Language Models (LLMs). Built with an optimized backend and ultra-fast inference APIs, this tool streamlines the hiring workflow by providing semantic analysis and contextual scoring.

---

## 🌟 Key Features

* **Semantic Resume Parsing:** Extracts structured details from unstructured PDF/Word resumes using advanced NLP techniques.
* **Contextual Job Description Matching:** Goes beyond basic keyword matching to analyze the actual depth of experience and skills against a specific job description.
* **AI-Driven Scoring & Feedback:** Leverages Llama models to generate a compatibility score and actionable feedback for the candidate.
* **Ultra-Fast Inference:** Integrated with the Groq API to ensure lightning-fast text processing and analysis generation.
* **Developer-Friendly API:** Built with a clean, modular Flask backend ready for integration with frontend dashboards.

---

## 🏗️ System Architecture

The application follows a decoupled, asynchronous-ready architecture to process resume data efficiently:


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

* **Backend Framework:** Python, Flask
* **AI & Inference:** Groq API (Llama Models)
* **Text Processing:** NLP Techniques, PyPDF2 / pdfplumber
* **Environment & Tools:** VS Code, Git, Postman (API Testing)
* **Target Cloud Deployment:** AWS (EC2 / Elastic Beanstalk)

---

## 🚀 Getting Started

### Prerequisites

* Python 3.8+
* A Groq API Key (Get one from the [Groq Console](https://console.groq.com/))

### Installation & Setup

1. **Clone the repository:**
```bash
   git clone [https://github.com/yourusername/ai-resume-checker.git](https://github.com/yourusername/ai-resume-checker.git)
   cd ai-resume-checker

```

2. **Create and activate a virtual environment:**

```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

```

3. **Install the dependencies:**

```bash
   pip install -r requirements.txt

```

4. **Configure environment variables:**
Create a `.env` file in the root directory and add your API credentials:

```env
   FLASK_APP=app.py
   FLASK_ENV=development
   GROQ_API_KEY=your_groq_api_key_here

```

5. **Run the application:**

```bash
   flask run

```

The backend API will be live at `http://127.0.0.1:5000/`.

---

## 🔌 API Endpoints (Core Backend)

### `POST /api/score-resume`

Processes a resume against a provided job description.

* **Content-Type:** `multipart/form-data`
* **Request Body:**
* `resume`: (File) `.pdf` or `.docx` format.
* `job_description`: (Text) The text of the target role requirement.


* **Example Response:**

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

---

## 📐 Engineering Highlights & Optimizations

* **Sub-Second AI Inference:** By swapping standard LLM APIs for the **Groq API Engine**, token generation latency was slashed, achieving incredibly fast evaluation times.
* **Prompt Engineering:** Developed a deterministic JSON-structured prompt template to enforce consistent parsing and eliminate LLM hallucination in parsing scoring matrices.
* **Text Normalization:** Implemented regex-based NLP pipelines to strip noise, headers, and invalid encodings out of PDF streams before hitting the model tokenizers, reducing token costs by ~25%.

---

## 📈 Future Roadmap

- [ ] Build a responsive frontend dashboard using HTML5/Tailwind CSS.
- [ ] Implement batch resume processing utilizing an asynchronous task queue (Celery/Redis).
- [ ] Containerize the full stack using Docker for seamless multi-environment deployment.
- [ ] Deploy live via AWS infrastructure.

```
