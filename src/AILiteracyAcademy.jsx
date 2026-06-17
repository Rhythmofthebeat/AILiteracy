import React, { useState, useEffect, useRef } from "react";

/* ============================================================
   AI LITERACY ACADEMY v3 — full curriculum edition
   - 31 lessons across 3 tracks, organized into modules
   - Quizzes, Practice Lab (real Python via Pyodide + AI mentor),
     AI Encyclopedia, dual AI engine (Claude / ChatGPT)
   ============================================================ */

const C = {
  paper: "#F7FAF9", card: "#FFFFFF", ink: "#14232B", inkSoft: "#4A5C66",
  teal: "#0F6B66", tealSoft: "#E2F0EE", amber: "#E8A33D", amberSoft: "#FBEFD9",
  codeBg: "#0F1B1E", codeText: "#D7E8E5", line: "#E3EAE8",
  green: "#2E8B57", red: "#C24B3A", purple: "#7A3E8F", blue: "#1D5C99",
};

/* ===================== AI ENGINE LAYER (OpenAI only) ===================== */

/* Key is read from VITE_OPENAI_KEY in .env (gitignored).
   For production, set the same var in your hosting provider's env settings
   (Vercel → Project Settings → Environment Variables, etc.)
   OR point BACKEND_URL at the Supabase proxy so the key never hits the browser. */
const OPENAI_KEY  = import.meta.env.VITE_OPENAI_KEY || "";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

async function callAI({ prompt, maxTokens = 1000, system = "" }) {
  // Route through backend proxy when available (key stays server-side)
  if (BACKEND_URL) {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, maxTokens }),
    });
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (!res.ok) throw new Error("BACKEND_" + res.status);
    const data = await res.json();
    return data.text || "";
  }

  // Direct OpenAI call using key from .env
  if (!OPENAI_KEY) throw new Error("NO_KEY");
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + OPENAI_KEY },
    body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: maxTokens, messages }),
  });
  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (!res.ok) throw new Error("OPENAI_" + res.status);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJSONLoose(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = Math.min(...["[", "{"].map((ch) => { const i = clean.indexOf(ch); return i === -1 ? Infinity : i; }));
  return JSON.parse(start === Infinity ? clean : clean.slice(start));
}

/* ===================== PYTHON RUNTIME (Pyodide) ===================== */

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
let pyodidePromise = null;
function loadPy() {
  if (!pyodidePromise) {
    pyodidePromise = new Promise((resolve, reject) => {
      const boot = () =>
        window.loadPyodide({ indexURL: PYODIDE_CDN }).then(resolve, (err) => {
          pyodidePromise = null; // allow retry
          reject(err);
        });
      if (window.loadPyodide) return boot();
      const s = document.createElement("script");
      s.src = PYODIDE_CDN + "pyodide.js";
      s.onload = boot;
      s.onerror = () => { pyodidePromise = null; reject(new Error("LOAD_FAIL")); };
      document.head.appendChild(s);
    });
  }
  return pyodidePromise;
}

/* ============================================================
   CURRICULUM — 31 lessons in modules
   ============================================================ */

const BEGINNER_LESSONS = [
  /* ---------- MODULE 1: UNDERSTANDING AI ---------- */
  {
    id: "b1", module: "Module 1 · Understanding AI", title: "What is AI, really?", minutes: 8,
    sections: [
      { heading: "A plain-language definition",
        body: "Artificial Intelligence (AI) is software that performs tasks that normally require human judgment — recognizing faces, understanding language, recommending a movie, or writing a paragraph. It doesn't 'think' like a person. Instead, it finds patterns in huge amounts of data and uses those patterns to make predictions or generate content." },
      { heading: "AI vs. Machine Learning vs. Deep Learning",
        body: "Think of these as nesting dolls. AI is the biggest doll: any technique that makes computers act smart. Machine Learning (ML) is inside it: systems that learn patterns from data instead of following hand-written rules. Deep Learning is inside ML: a powerful style that uses 'neural networks' — layered math structures loosely inspired by the brain — and powers most modern AI like ChatGPT and image generators." },
      { heading: "Narrow AI vs. the sci-fi kind",
        body: "Every AI you can use today is 'narrow AI': brilliant at specific tasks, clueless outside them. A chess AI can't drive a car; a chatbot can't smell smoke. The sci-fi version — AGI (Artificial General Intelligence), a system as broadly capable as a human — does not exist yet, though major labs are explicitly trying to build it. Knowing the difference protects you from both hype and panic." },
    ],
    keyTerms: [
      ["AI", "Software performing tasks that require human-like judgment"],
      ["Machine Learning", "AI that learns patterns from data rather than fixed rules"],
      ["Deep Learning", "ML using layered neural networks; powers modern AI"],
      ["Narrow AI", "AI that excels at one task only — everything available today"],
      ["AGI", "Hypothetical AI with broad human-level ability; doesn't exist yet"],
    ],
  },
  {
    id: "b2", module: "Module 1 · Understanding AI", title: "From chess to ChatGPT: a brief history", minutes: 9,
    sections: [
      { heading: "1950–1997: rules and the first 'AI winters'",
        body: "In 1950, Alan Turing proposed his famous test: if you can't tell a machine's conversation from a human's, call it intelligent. Early AI was hand-written rules ('expert systems') and repeatedly overpromised, leading to funding collapses nicknamed 'AI winters'. The era peaked in 1997 when IBM's Deep Blue beat world chess champion Garry Kasparov — impressive, but still mostly brute-force rule-following, not learning." },
      { heading: "2012–2020: the deep learning explosion",
        body: "In 2012, a neural network called AlexNet crushed the ImageNet photo-recognition competition, proving deep learning worked when given enough data and GPU power. Breakthroughs cascaded: in 2016, DeepMind's AlphaGo beat Go champion Lee Sedol using moves human masters called 'creative'. In 2017, Google researchers published the Transformer architecture — the invention every modern chatbot is built on." },
      { heading: "2020–today: the generative era",
        body: "Scaling Transformers up produced GPT-3 (2020), which could write essays from a prompt. ChatGPT's launch in November 2022 reached 100 million users in two months — the fastest-adopted consumer product in history at the time — and triggered today's AI race among OpenAI, Anthropic, Google, and Meta. The lesson of the history: AI progress comes in sudden jumps, and each jump surprised even experts." },
    ],
    keyTerms: [
      ["Turing test", "Can a machine's conversation pass as human?"],
      ["AI winter", "A period when AI overpromised and funding collapsed"],
      ["ImageNet moment", "2012 contest win that proved deep learning works"],
      ["AlphaGo", "DeepMind's system that beat the world Go champion in 2016"],
      ["Transformer", "2017 architecture behind every modern chatbot"],
    ],
  },
  {
    id: "b3", module: "Module 1 · Understanding AI", title: "How AI learns (no math required)", minutes: 9,
    sections: [
      { heading: "Training: learning from millions of examples",
        body: "Imagine teaching a child to recognize cats by showing them 10 million photos labeled 'cat' or 'not cat'. That's training. The AI starts out guessing randomly, gets told how wrong each guess was, and adjusts its internal settings slightly. Repeat billions of times and the settings encode a genuine ability to recognize cats — including cats it has never seen." },
      { heading: "Why data is the fuel",
        body: "An AI is only as good as its training data. ChatGPT-style models read a huge slice of the internet — books, articles, code, websites. Spotify learned your taste from billions of listening sessions. This is why companies guard data jealously, why 'more data usually beats a cleverer algorithm', and why biased or low-quality data produces biased or low-quality AI." },
      { heading: "Prediction, not understanding",
        body: "Here's the most clarifying idea in all of AI literacy: a chatbot is a next-word prediction machine. Given 'The capital of France is', it predicts 'Paris' because that pattern dominated its training data. Astonishing abilities — reasoning, coding, poetry — emerge from this prediction at massive scale. But it also explains hallucinations: the model predicts what sounds right, which is usually, but not always, what is right." },
    ],
    keyTerms: [
      ["Training", "Adjusting an AI's internal settings using labeled examples"],
      ["Training data", "The examples an AI learns from — its entire worldview"],
      ["Model", "The trained result: a file of learned settings (weights)"],
      ["Next-word prediction", "The core mechanic behind every chatbot"],
    ],
  },
  /* ---------- MODULE 2: THE TOOL LANDSCAPE ---------- */
  {
    id: "b4", module: "Module 2 · The tool landscape", title: "Chatbots compared: picking your assistant", minutes: 10,
    sections: [
      { heading: "The big four and what sets them apart",
        body: "ChatGPT (OpenAI) is the household name with the largest ecosystem of plugins and integrations. Claude (Anthropic) is known for handling very long documents and careful, nuanced writing. Gemini (Google) is woven into Gmail, Docs, and Android. Microsoft Copilot brings GPT models into Word, Excel, and Windows itself. All have free tiers; paid tiers (~$20/month) unlock the strongest models and higher limits." },
      { heading: "Context windows: the AI's working memory",
        body: "A 'context window' is how much text the AI can consider at once — its working memory for your conversation. Small windows mean the AI 'forgets' the start of long chats; large ones let you paste in entire books or codebases and ask questions. When you hear a model can handle '200K tokens', that's roughly 150,000 words of working memory. It's one of the most practical specs to compare." },
      { heading: "Free vs. paid: when upgrading matters",
        body: "Free tiers are genuinely capable for everyday use. Upgrade when you hit limits that cost you time: message caps during busy hours, weaker models for complex reasoning, no file uploads, or no access to newest features. A useful rule: if you use a chatbot more than 30 minutes a day for work or study, the paid tier usually pays for itself." },
    ],
    keyTerms: [
      ["Context window", "How much text the AI can 'hold in mind' at once"],
      ["Token", "A chunk of text (~3/4 of a word) — how AI measures text"],
      ["Model tier", "Free plans use smaller models; paid unlocks the strongest"],
      ["Ecosystem", "Plugins, apps, and integrations around a chatbot"],
    ],
  },
  {
    id: "b5", module: "Module 2 · The tool landscape", title: "Creative AI: images, video, music, voice", minutes: 10,
    sections: [
      { heading: "Images: describe it, get it",
        body: "Midjourney produces the most artistic, stylized results (popular with designers). DALL·E lives inside ChatGPT, making it the easiest entry point. Stable Diffusion is open-source — free to run on your own computer and infinitely customizable. Adobe Firefly is built into Photoshop and trained only on licensed images, making it the safe pick for commercial work. The skill is the same everywhere: specific descriptions of subject, style, lighting, and mood." },
      { heading: "Video and music join the party",
        body: "Text-to-video arrived in 2024: OpenAI's Sora and Runway generate short cinematic clips from descriptions, and the quality is improving every few months. Suno and Udio compose complete songs — vocals, lyrics, instruments — from a text prompt. ElevenLabs clones and generates voices so realistically it's used for audiobooks and dubbing films into other languages with the original actor's voice." },
      { heading: "The flip side: deepfakes",
        body: "The same technology creates 'deepfakes' — fabricated video or audio of real people. Scammers have cloned voices from seconds of audio to fake family-emergency calls, and fake videos of politicians circulate before elections. Defenses you can use today: be skeptical of emotionally urgent media, check whether reputable outlets carry the story, look for unnatural blinking or warped backgrounds, and agree on a family code word for phone emergencies." },
    ],
    keyTerms: [
      ["Text-to-image", "Generating pictures from written descriptions"],
      ["Open-source model", "AI whose code/weights are free to download and modify"],
      ["Voice cloning", "Recreating a specific person's voice from samples"],
      ["Deepfake", "AI-fabricated media impersonating a real person"],
    ],
  },
  {
    id: "b6", module: "Module 2 · The tool landscape", title: "AI hiding in your daily apps", minutes: 8,
    sections: [
      { heading: "Your office suite got smart",
        body: "Microsoft Copilot drafts Word documents, builds Excel formulas from plain English ('sum sales where region is East'), and turns documents into PowerPoint decks. Google's Gemini does the same across Docs, Sheets, and Gmail — 'Help me write' is now a button. Notion AI summarizes meeting notes; Canva's Magic Studio designs from a description. You may already be paying for AI you've never clicked." },
      { heading: "Recommendation engines: the invisible AI",
        body: "The most influential AI in your life has no chat box. Recommendation systems decide your TikTok feed, Netflix homepage, Spotify Discover Weekly, YouTube sidebar, and Amazon suggestions. They learn from every pause, skip, and replay. Understanding this changes how you see your feeds: they're not a window on the world — they're a mirror of your past behavior, optimized to keep you engaged." },
      { heading: "Your phone is an AI device",
        body: "Modern phones run AI directly on the chip: face unlock, photo enhancement that 'fixes' shots before you see them, live transcription of voicemails, real-time translation in conversations, and 'erase the photobomber' editing. On-device AI matters for privacy too — data processed on your phone never has to leave it." },
    ],
    keyTerms: [
      ["Copilot pattern", "AI embedded inside an app you already use"],
      ["Recommendation system", "AI that ranks content based on your behavior"],
      ["Engagement optimization", "Tuning feeds to maximize your time spent"],
      ["On-device AI", "AI running on your phone's chip, not in the cloud"],
    ],
  },
  {
    id: "b7", module: "Module 2 · The tool landscape", title: "AI agents: the next wave", minutes: 9,
    sections: [
      { heading: "From answering to acting",
        body: "A chatbot answers questions; an 'agent' completes tasks. Tell an agent 'find me a flight to Houston under $300 next Friday and hold a seat' and it browses the web, compares options, fills forms, and reports back — taking many steps and making decisions along the way. This shift from conversation to action is widely considered the next major phase of AI." },
      { heading: "Agents you can see today",
        body: "Early agents are already public: deep-research modes in ChatGPT, Claude, and Gemini browse dozens of sources for 10+ minutes and return cited reports. Computer-use agents can operate a browser — clicking, scrolling, typing — to do things like fill out forms or compile spreadsheets. Coding agents like Claude Code and GitHub Copilot's agent mode take a feature request and write, test, and fix code across many files on their own." },
      { heading: "Why agents need extra caution",
        body: "An AI that only talks can mislead you; an AI that acts can spend your money, send your emails, or delete your files. Good agent design keeps a human 'in the loop' for consequential steps — confirming before purchases or sends. As agents arrive in your tools, the literacy skill is knowing what you've authorized them to do and reviewing their work like you'd review a new intern's." },
    ],
    keyTerms: [
      ["AI agent", "AI that takes multi-step actions to complete a task"],
      ["Deep research", "Agent mode that browses many sources and writes a report"],
      ["Computer use", "An agent operating a screen: clicking, typing, scrolling"],
      ["Human in the loop", "Requiring human approval for consequential actions"],
    ],
  },
  /* ---------- MODULE 3: SKILLS FOR THE AI ERA ---------- */
  {
    id: "b8", module: "Module 3 · Skills for the AI era", title: "Prompting masterclass", minutes: 10,
    sections: [
      { heading: "The four ingredients, then the pro moves",
        body: "Foundation: state the Task, give Context, specify Format, set the Role/tone. Pro move #1 — show examples: 'Rewrite these headlines in this style: [two examples of the style you want]'. Few-shot examples often improve results more than any other technique. Pro move #2 — invite reasoning: for tricky problems, add 'think through this step by step before answering' and watch accuracy jump." },
      { heading: "Give it a job description",
        body: "Models respond strongly to roles: 'You are an experienced college admissions counselor reviewing this essay' produces sharper feedback than 'review my essay'. Add constraints to the role: what to focus on, what to ignore, how harsh to be. For recurring tasks, save your best role-prompts — most chatbots let you store them as custom instructions or 'projects' so every chat starts pre-configured." },
      { heading: "The conversation IS the technique",
        body: "Experts rarely accept a first draft. They interrogate it: 'What's the weakest part of your answer?', 'Give me three alternatives with different tones', 'Now argue against your own recommendation'. Asking the AI to critique itself, or asking the same question in a fresh chat and comparing, catches errors a single response hides. Treat the model as a tireless junior collaborator, not an oracle." },
    ],
    keyTerms: [
      ["Few-shot prompting", "Providing examples of the output you want"],
      ["Chain-of-thought", "Asking the AI to reason step by step"],
      ["Role prompting", "Assigning the AI a persona and job description"],
      ["Custom instructions", "Saved preferences applied to every new chat"],
    ],
  },
  {
    id: "b9", module: "Module 3 · Skills for the AI era", title: "Spotting AI fakes and misinformation", minutes: 9,
    sections: [
      { heading: "Visual tells (while they last)",
        body: "AI images still slip up on: text in images (garbled signs, mangled logos), hands and teeth, jewelry and glasses merging into skin, impossibly smooth or waxy textures, and backgrounds where lines bend illogically. In video, watch for unnatural blinking, hair edges that shimmer, and lips slightly out of sync. Important caveat: these tells shrink every year — never rely on them alone." },
      { heading: "Verification beats detection",
        body: "Since detection gets harder, verify provenance instead. Reverse-image-search striking photos (Google Lens) to find their origin. Check if any reputable outlet carries the explosive claim — real news breaks in many places at once. Notice emotional manipulation: content engineered to make you furious or terrified is engineered to be shared before it's checked. The SIFT method: Stop, Investigate the source, Find better coverage, Trace to the original." },
      { heading: "AI-written text and your defenses",
        body: "AI text 'detectors' are unreliable — they falsely flag human writing (especially non-native speakers) and miss edited AI text; treat any detector verdict as a weak hint, not proof. Better habits: judge claims by their evidence and sources, not by prose style. And when YOU use AI to write, disclose it where it matters (school, work) and fact-check anything factual before your name goes on it." },
    ],
    keyTerms: [
      ["Provenance", "Where a piece of media originally came from"],
      ["Reverse image search", "Finding the origin and history of an image"],
      ["SIFT method", "Stop, Investigate, Find coverage, Trace the original"],
      ["AI detector", "Tool claiming to spot AI text — unreliable; don't trust alone"],
    ],
  },
  {
    id: "b10", module: "Module 3 · Skills for the AI era", title: "Bias, privacy, jobs — and your move", minutes: 10,
    sections: [
      { heading: "Bias: when patterns become prejudice",
        body: "AI learns from human data, so it inherits human biases. Documented cases: a hiring model that learned to penalize résumés containing the word 'women's' (as in 'women's chess club') because past hires skewed male; facial recognition with far higher error rates on darker skin; loan models echoing historic redlining. The fix isn't 'trust the computer' — it's auditing AI decisions and keeping humans accountable for them, especially decisions about people." },
      { heading: "Privacy: a working checklist",
        body: "Before pasting anything sensitive, know: Does this tool train on my chats? (Most consumer tiers do by default; most offer an opt-out in settings; business tiers usually don't.) Could I screenshot this conversation onto a billboard without harm? If not, redact names, numbers, and identifiers first. Use temporary/incognito chat modes for sensitive one-offs. These three habits cover 90% of real-world risk." },
      { heading: "Jobs: augmentation is the realistic story",
        body: "Studies so far show AI boosting productivity most for less-experienced workers, compressing skill gaps. Tasks are automating faster than whole jobs: writing first drafts, summarizing meetings, basic code. The durable advantage goes to people who pair domain skill with AI fluency — the radiologist who uses AI screening, the teacher who builds AI-assisted lessons. Which is, not coincidentally, what you're doing in this app right now." },
    ],
    keyTerms: [
      ["Algorithmic bias", "Systematic unfairness learned from skewed data"],
      ["Training opt-out", "Setting that stops your chats being used for training"],
      ["Task vs. job automation", "AI replaces tasks within jobs faster than jobs"],
      ["AI fluency", "Knowing what AI can do and directing it well — your edge"],
    ],
  },
];

const INTERMEDIATE_LESSONS = [
  /* ---------- MODULE 1: ML FOUNDATIONS ---------- */
  {
    id: "i1", module: "Module 1 · ML foundations", title: "How machines learn: the core ideas", minutes: 12,
    sections: [
      { heading: "Supervised vs. unsupervised vs. reinforcement",
        body: "Supervised learning trains on labeled examples — emails marked 'spam' or 'not spam' — to predict labels for new data. Unsupervised learning gets no labels; it finds hidden structure, like grouping customers into segments. Reinforcement learning learns by trial and error with rewards — how game-playing AIs and robot controllers train. Most business ML is supervised; knowing which paradigm fits a problem is the first skill of an ML practitioner." },
      { heading: "Features, labels, and the two task types",
        body: "Features are the input variables (a house's square footage, bedrooms, ZIP code). The label is what you predict (the price). Training means showing the model many feature→label examples so it learns the relationship. Classification predicts a category (spam/not spam, which digit, churn/stay); regression predicts a number (price, temperature, demand). Every supervised problem is one or the other — identify which before touching code." },
      { heading: "Train/test split and overfitting",
        body: "You never grade a model on data it studied. Split your data — typically 80% train, 20% test — and judge performance only on the unseen test set. A model that memorizes training data but fails on new data is 'overfitting': a student who memorized last year's answer key instead of learning the subject. The entire discipline of ML is, in a sense, the fight against overfitting." },
    ],
    keyTerms: [
      ["Feature", "An input variable the model uses to predict"],
      ["Label", "The target value the model learns to predict"],
      ["Classification / Regression", "Predicting a category / predicting a number"],
      ["Overfitting", "Memorizing training data; failing on new data"],
      ["Reinforcement learning", "Learning by trial, error, and reward"],
    ],
  },
  {
    id: "i2", module: "Module 1 · ML foundations", title: "The data pipeline: cleaning real-world mess", minutes: 12,
    sections: [
      { heading: "Real data is dirty — embrace it",
        body: "Tutorials hand you clean data; reality hands you missing values, duplicate rows, '​N/A' typed five different ways, ages of 250, and dates in three formats. Practitioners estimate 60–80% of project time goes to data preparation. This isn't the boring part before ML — it IS ML. A mediocre model on clean data beats a brilliant model on garbage, every time.",
        code: `import pandas as pd

df = pd.read_csv("customers.csv")
df.info()                  # dtypes + missing counts
df.duplicated().sum()      # duplicate rows
df["age"].describe()       # spot impossible values
df["city"].value_counts()  # spot 'NYC' vs 'New York'` },
      { heading: "Handling missing values",
        body: "Three strategies, in rough order of preference: 1) If a column is mostly empty, drop it. 2) If a few rows have gaps, you can drop the rows. 3) Otherwise 'impute': fill numeric gaps with the median (robust to outliers) and categorical gaps with the most frequent value or an explicit 'Unknown' category. Document every choice — imputation invents data, and you should know where.",
        code: `df = df.drop(columns=["fax_number"])      # 95% empty
df["income"] = df["income"].fillna(
    df["income"].median())                  # numeric → median
df["region"] = df["region"].fillna("Unknown")` },
      { heading: "Encoding: turning words into numbers",
        body: "Models eat numbers, not strings. One-hot encoding turns a 'color' column with red/green/blue into three 0/1 columns — the standard for categories with no order. For ordered categories (small < medium < large), map them to 0/1/2 instead. A classic beginner bug: feeding category codes like 1,2,3 to a model as if the numbers had meaning, making it believe 'blue' is three times 'red'.",
        code: `df = pd.get_dummies(df, columns=["region"])  # one-hot
size_map = {"S": 0, "M": 1, "L": 2}
df["size"] = df["size"].map(size_map)        # ordinal` },
    ],
    keyTerms: [
      ["Data cleaning", "Fixing missing, duplicate, and impossible values"],
      ["Imputation", "Filling missing values (median, mode, 'Unknown')"],
      ["One-hot encoding", "Turning a category column into 0/1 columns"],
      ["Ordinal encoding", "Mapping ordered categories to ordered numbers"],
    ],
  },
  {
    id: "i3", module: "Module 1 · ML foundations", title: "Feature engineering: the secret weapon", minutes: 11,
    sections: [
      { heading: "Better features beat better algorithms",
        body: "Feature engineering means creating new input variables that expose patterns to the model. From a raw 'date' column: day-of-week, is-weekend, days-until-holiday. From 'height' and 'weight': BMI. From a timestamp and a user's last purchase: days-since-last-order — often the single best churn predictor. Kaggle competitions are routinely won not by exotic models but by cleverer features. Domain knowledge is your superpower here.",
        code: `df["date"] = pd.to_datetime(df["date"])
df["dayofweek"] = df["date"].dt.dayofweek
df["is_weekend"] = df["dayofweek"] >= 5
df["price_per_sqft"] = df["price"] / df["sqft"]` },
      { heading: "Scaling: putting features on equal footing",
        body: "If 'income' ranges 0–500,000 and 'age' ranges 0–100, distance-based models (KNN, SVM) and neural networks will be dominated by income purely because its numbers are bigger. Standardization rescales each feature to mean 0, standard deviation 1. Tree-based models (decision trees, random forests) don't care about scale — one of several reasons they're forgiving favorites.",
        code: `from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)  # NOTE: transform only!` },
      { heading: "Data leakage: the silent project-killer",
        body: "Leakage is when information from the future or from the test set sneaks into training, producing dazzling offline accuracy and disastrous real-world performance. Classic examples: scaling using statistics computed on ALL data before splitting (that's why the code above fits the scaler on train only), or a 'days_in_hospital' feature when predicting hospital admission. Rule: at prediction time in the real world, would I actually have this value? If not, it's leakage." },
    ],
    keyTerms: [
      ["Feature engineering", "Creating new inputs that expose patterns"],
      ["Standardization", "Rescaling features to mean 0, std 1"],
      ["Data leakage", "Future/test information contaminating training"],
      ["fit_transform vs transform", "Learn scaling from train; only apply to test"],
    ],
  },
  /* ---------- MODULE 2: ALGORITHMS IN PRACTICE ---------- */
  {
    id: "i4", module: "Module 2 · Algorithms in practice", title: "Your Python ML toolkit", minutes: 10,
    sections: [
      { heading: "The big four libraries",
        body: "NumPy handles fast math on arrays. Pandas manages tabular data with its DataFrame. Matplotlib draws charts. Scikit-learn provides ready-made ML algorithms behind one consistent interface. Nearly every ML project starts with these four — and Google Colab gives you all of them, pre-installed, free, in your browser with GPU access. There is no installation excuse: colab.research.google.com and you're coding." },
      { heading: "Exploring before modeling",
        body: "Professionals spend the first hour of any project just looking: .head() to see rows, .describe() for statistics, .corr() for which features relate to the target, and quick plots. This 'exploratory data analysis' (EDA) catches data problems early and often reveals the answer's shape before any model runs.",
        code: `import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("housing.csv")
print(df.describe())
print(df.corr(numeric_only=True)["price"]
      .sort_values(ascending=False))
df.plot.scatter(x="sqft", y="price"); plt.show()` },
      { heading: "The scikit-learn pattern",
        body: "Every scikit-learn model follows the same rhythm: create the model, .fit() on training data, .predict() on new data, .score() to evaluate. Learn the pattern once and you can swap dozens of algorithms — logistic regression, random forests, gradient boosting — by changing a single line. This consistent API is why sklearn has ruled classic ML for a decade.",
        code: `from sklearn.ensemble import RandomForestRegressor

model = RandomForestRegressor()   # 1. create
model.fit(X_train, y_train)       # 2. learn
preds = model.predict(X_test)     # 3. predict
print(model.score(X_test, y_test))# 4. evaluate` },
    ],
    keyTerms: [
      ["EDA", "Exploratory Data Analysis — investigating before modeling"],
      ["Correlation", "How strongly two variables move together (-1 to 1)"],
      ["fit / predict / score", "scikit-learn's universal three-step pattern"],
      ["Google Colab", "Free browser notebooks with everything pre-installed"],
    ],
  },
  {
    id: "i5", module: "Module 2 · Algorithms in practice", title: "Regression in depth", minutes: 12,
    sections: [
      { heading: "Linear regression: the 200-year-old workhorse",
        body: "Linear regression fits the best straight line (or hyperplane) through your data: price = w1·sqft + w2·bedrooms + ... + b. The model IS those learned weights, and they're interpretable: 'each extra square foot adds $142'. That transparency is why linear models still dominate in medicine, economics, and anywhere you must explain predictions — sometimes interpretability beats a few points of accuracy.",
        code: `from sklearn.linear_model import LinearRegression

model = LinearRegression().fit(X_train, y_train)
for name, w in zip(feature_names, model.coef_):
    print(f"{name}: {w:+.2f}")
print("intercept:", model.intercept_)` },
      { heading: "Measuring regression: MAE, RMSE, R²",
        body: "MAE (mean absolute error) is the average miss in real units — 'off by $23,000 on average' — and easy to explain. RMSE squares errors before averaging, punishing big misses harder; prefer it when large errors are disproportionately costly. R² says what fraction of the target's variation your model explains (1.0 perfect, 0.0 no better than guessing the mean). Report MAE or RMSE alongside R² — R² alone hides the actual error size.",
        code: `from sklearn.metrics import (mean_absolute_error,
    mean_squared_error, r2_score)

print("MAE :", mean_absolute_error(y_test, preds))
print("RMSE:", mean_squared_error(y_test, preds) ** 0.5)
print("R²  :", r2_score(y_test, preds))` },
      { heading: "When lines aren't enough",
        body: "Real relationships curve. Options: engineer non-linear features (sqft², log(income)); use regularized cousins Ridge and Lasso, which shrink weights to fight overfitting (Lasso can zero-out useless features — automatic feature selection); or step up to tree ensembles like RandomForestRegressor and gradient boosting, which capture curves and interactions automatically at the cost of interpretability. Start linear, establish a baseline, then earn complexity." },
    ],
    keyTerms: [
      ["Coefficient (weight)", "How much one feature unit changes the prediction"],
      ["MAE / RMSE", "Average error / error that punishes big misses"],
      ["R²", "Fraction of target variation the model explains"],
      ["Ridge & Lasso", "Linear regression with overfitting penalties"],
      ["Baseline model", "Simple first model every fancy model must beat"],
    ],
  },
  {
    id: "i6", module: "Module 2 · Algorithms in practice", title: "The classification zoo: which algorithm when", minutes: 13,
    sections: [
      { heading: "Logistic regression and KNN: the simple duo",
        body: "Despite the name, logistic regression is a classifier: it outputs a probability (0–1) of belonging to a class, then thresholds it. Fast, interpretable, hard to beat as a baseline for text and tabular problems. K-Nearest Neighbors (KNN) classifies a point by majority vote of its k closest training points — beautifully intuitive, no training phase at all, but slow at prediction time and sensitive to feature scaling." },
      { heading: "Trees and forests: the tabular champions",
        body: "A decision tree learns human-readable rules: 'if income > 50K and age < 30 → approve'. Single trees overfit badly. A random forest trains hundreds of trees on random slices of data/features and lets them vote — dramatically more accurate and stable. Gradient boosting (XGBoost, LightGBM) builds trees sequentially, each correcting the last's mistakes, and wins most tabular-data competitions. Forests and boosting should be your default first 'serious' models.",
        code: `from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=200)
model.fit(X_train, y_train)

# Bonus: which features mattered most?
for name, imp in sorted(zip(feature_names,
        model.feature_importances_), key=lambda x: -x[1])[:5]:
    print(f"{name}: {imp:.3f}")` },
      { heading: "A practical selection guide",
        body: "Need interpretability or a fast baseline → logistic regression. Tabular data, want strong accuracy with little tuning → random forest. Chasing maximum tabular accuracy → gradient boosting. Tiny dataset with meaningful distances → KNN. Images, audio, or text at scale → neural networks (the Expert track). And always compare everything against a 'dummy' baseline that predicts the most common class — if your model barely beats it, back to feature engineering." },
    ],
    keyTerms: [
      ["Logistic regression", "Linear classifier outputting class probabilities"],
      ["KNN", "Classify by majority vote of the k nearest examples"],
      ["Random forest", "Hundreds of varied trees voting together"],
      ["Gradient boosting", "Trees built sequentially, each fixing prior errors"],
      ["Feature importance", "Ranking of which inputs drove predictions"],
    ],
  },
  {
    id: "i7", module: "Module 2 · Algorithms in practice", title: "Unsupervised learning: clusters and compression", minutes: 12,
    sections: [
      { heading: "K-means: finding groups without labels",
        body: "K-means partitions data into k clusters: place k center points, assign every example to its nearest center, move each center to its cluster's average, repeat until stable. Uses: customer segmentation ('we apparently have five types of shoppers'), grouping similar documents or songs, detecting anomalies (points far from every center). You choose k — the 'elbow method' plots clustering quality versus k and you pick the bend.",
        code: `from sklearn.cluster import KMeans

km = KMeans(n_clusters=4, n_init="auto").fit(X)
df["segment"] = km.labels_
print(df.groupby("segment")[["age","spend"]].mean())` },
      { heading: "PCA: compressing 100 columns into 2",
        body: "Principal Component Analysis finds the directions along which your data varies most and re-expresses it in fewer dimensions. Two killer uses: visualization (project 50-feature data to 2D and actually SEE the clusters) and speed (feed 10 components instead of 100 noisy features to a model). You trade a little information for a lot of clarity — PCA reports exactly how much variance each component preserves.",
        code: `from sklearn.decomposition import PCA

pca = PCA(n_components=2)
X2 = pca.fit_transform(X_scaled)
print(pca.explained_variance_ratio_)  # e.g. [0.61, 0.19]
plt.scatter(X2[:,0], X2[:,1], c=km.labels_); plt.show()` },
      { heading: "Honest limits of unsupervised work",
        body: "With no labels, there's no accuracy score — evaluating clusters is partly judgment. K-means assumes roundish, similar-sized clusters and can split or merge real groups; always scale features first or big-ranged ones dominate. The professional pattern: use unsupervised methods to explore and generate hypotheses ('these five segments exist'), then validate with domain experts or downstream supervised tasks. It's a flashlight, not a verdict." },
    ],
    keyTerms: [
      ["K-means", "Clustering by iteratively moving k center points"],
      ["Elbow method", "Choosing k by where quality gains flatten"],
      ["PCA", "Re-expressing data in fewer, most-informative dimensions"],
      ["Explained variance", "How much information each PCA component keeps"],
    ],
  },
  /* ---------- MODULE 3: DOING IT RIGHT ---------- */
  {
    id: "i8", module: "Module 3 · Doing it right", title: "Your first end-to-end model", minutes: 14,
    sections: [
      { heading: "A complete classification project",
        body: "Here's an end-to-end project on the classic Iris dataset: load data, split it, train a decision tree, and measure accuracy. This same skeleton — load, split, fit, evaluate — scales to fraud detection and medical diagnosis. Run this for real in Google Colab, then re-build it from memory in this app's Practice Lab.",
        code: `from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)

model = DecisionTreeClassifier()
model.fit(X_train, y_train)
preds = model.predict(X_test)
print(accuracy_score(y_test, preds))  # e.g. 0.97` },
      { heading: "Beyond accuracy: precision, recall, confusion",
        body: "Accuracy misleads on imbalanced data — a model that never flags fraud is 99% accurate if fraud is 1% of cases, and 100% useless. Precision: of items I flagged, how many were right? Recall: of items I should have caught, how many did I catch? They trade off — a cancer screen tunes for recall (miss nothing), a spam filter for precision (never eat a real email). The confusion matrix lays out all four outcomes (TP, FP, FN, TN) at a glance.",
        code: `from sklearn.metrics import (classification_report,
                             confusion_matrix)
print(confusion_matrix(y_test, preds))
print(classification_report(y_test, preds))` },
      { heading: "The improvement loop",
        body: "When results disappoint, improve in this order: 1) More/better data and features — highest payoff. 2) Try a stronger algorithm family (tree → forest → boosting). 3) Tune hyperparameters (next lesson). 4) Only then, exotic methods. And keep an experiment log — model, features, scores — because two weeks in, you will not remember whether run #7 had the scaled features. Beginners obsess over algorithms; professionals obsess over data and process." },
    ],
    keyTerms: [
      ["Precision / Recall", "Quality of flags / coverage of true cases"],
      ["Confusion matrix", "Grid of true/false positives and negatives"],
      ["Class imbalance", "When one class vastly outnumbers another"],
      ["Experiment log", "Record of every run's setup and scores"],
    ],
  },
  {
    id: "i9", module: "Module 3 · Doing it right", title: "Cross-validation and tuning", minutes: 12,
    sections: [
      { heading: "One split can lie — cross-validate",
        body: "A single train/test split can be lucky or unlucky, especially on small datasets. K-fold cross-validation splits data into k parts (usually 5), trains on four, tests on the fifth, and rotates — giving you a mean score AND its spread. A model scoring 85% ± 2% is trustworthy; 85% ± 15% is a coin flip wearing a suit. Report both numbers, always.",
        code: `from sklearn.model_selection import cross_val_score

scores = cross_val_score(model, X, y, cv=5)
print(f"{scores.mean():.3f} ± {scores.std():.3f}")` },
      { heading: "Hyperparameter tuning with GridSearchCV",
        body: "Hyperparameters are the settings YOU choose: a forest's tree count and max depth, KNN's k. GridSearchCV tries every combination you list, cross-validating each, and hands you the best — automated, honest tuning. Its cousin RandomizedSearchCV samples random combinations and often finds near-best settings far faster when the grid is large.",
        code: `from sklearn.model_selection import GridSearchCV

grid = GridSearchCV(
    RandomForestClassifier(),
    {"n_estimators": [100, 300],
     "max_depth": [5, 10, None]},
    cv=5)
grid.fit(X_train, y_train)
print(grid.best_params_, grid.best_score_)` },
      { heading: "The cardinal sin: tuning on the test set",
        body: "If you tweak hyperparameters until the test score peaks, you've silently fit the test set — your 'unseen data' isn't unseen anymore, and the reported score is inflated. Correct protocol: lock a final test set away; do ALL exploration and tuning inside cross-validation on the training portion; touch the test set exactly once, at the very end, for the number you report. This discipline is what separates trustworthy results from accidental self-deception." },
    ],
    keyTerms: [
      ["K-fold cross-validation", "Rotating train/test splits for robust scores"],
      ["Hyperparameter", "A setting you choose before training"],
      ["GridSearchCV", "Exhaustive, cross-validated settings search"],
      ["Test-set discipline", "Touch the final test set exactly once"],
    ],
  },
  {
    id: "i10", module: "Module 3 · Doing it right", title: "From notebook to the real world", minutes: 11,
    sections: [
      { heading: "Saving and loading models",
        body: "A trained model is just learned numbers — save it to a file and reuse it without retraining. joblib is the standard for sklearn. This file IS the product: the thing your app loads to make live predictions. Version it like code (model_v3_2026-06.joblib) and store the training data snapshot and metrics beside it, because 'which model is in production?' should never be a mystery.",
        code: `import joblib

joblib.dump(model, "churn_model_v1.joblib")
# ...later, in your app:
model = joblib.load("churn_model_v1.joblib")
model.predict(new_customer_features)` },
      { heading: "Serving predictions: the API pattern",
        body: "Real products don't open notebooks — they call APIs. The standard pattern: wrap your model in a tiny web service (FastAPI is the Python favorite) with one endpoint: JSON features in, prediction out. Your website, mobile app, or hospital system POSTs to /predict and gets an answer in milliseconds. Congratulations: that architecture diagram is most production ML.",
        code: `# serve.py — run with: uvicorn serve:app
from fastapi import FastAPI
import joblib

app = FastAPI()
model = joblib.load("churn_model_v1.joblib")

@app.post("/predict")
def predict(features: list[float]):
    return {"prediction": int(model.predict([features])[0])}` },
      { heading: "Models rot: monitoring and drift",
        body: "The world changes; your frozen model doesn't. Customer behavior shifts, prices inflate, a pandemic rewrites every pattern — this is 'drift', and it silently degrades accuracy. Production basics: log every prediction, compare incoming data's distribution to training data, track live accuracy when true outcomes arrive, set alerts, and schedule retraining. A deployed model is a pet, not a statue — it needs feeding. This whole discipline has a name you'll meet again in the Expert track: MLOps." },
    ],
    keyTerms: [
      ["joblib", "Standard tool for saving/loading sklearn models"],
      ["Model serving", "Exposing predictions through an API endpoint"],
      ["Data drift", "Real-world data shifting away from training data"],
      ["MLOps", "The practice of running ML reliably in production"],
    ],
  },
];

const EXPERT_LESSONS = [
  /* ---------- MODULE 1: NEURAL NETWORK CORE ---------- */
  {
    id: "e1", module: "Module 1 · Neural network core", title: "Inside a neural network", minutes: 14,
    sections: [
      { heading: "Neurons, layers, weights",
        body: "A neural network is layers of simple units. Each unit computes a weighted sum of its inputs, adds a bias, and passes the result through an activation function (like ReLU) that adds non-linearity — without it, stacking layers would collapse into one linear equation. The 'knowledge' of the network lives entirely in its weights: GPT-class models are, at bottom, hundreds of billions of these learned numbers." },
      { heading: "The training loop",
        body: "Training is a loop: 1) forward pass — data flows through and produces a prediction; 2) the loss function measures how wrong it is; 3) backpropagation computes how much each weight contributed to the error; 4) the optimizer nudges every weight slightly downhill on the loss. Repeat over many batches and epochs. Everything in deep learning — from MNIST to ChatGPT — is this loop at different scales." },
      { heading: "Why depth works: hierarchical features",
        body: "Visualizing trained networks reveals the magic: early layers learn edges and colors, middle layers learn textures and parts (eyes, wheels), late layers learn whole concepts (faces, cars). Each layer composes the previous layer's features into something more abstract. Depth is a feature-building assembly line — which is why 'deep' learning crushed the old approach of humans hand-designing features." },
    ],
    keyTerms: [
      ["Activation function", "Non-linearity (e.g., ReLU) applied at each unit"],
      ["Loss function", "Measures how wrong the model's predictions are"],
      ["Backpropagation", "Computes each weight's contribution to the error"],
      ["Epoch / batch", "Full pass through data / one weight-update group"],
      ["Feature hierarchy", "Edges → parts → concepts across layers"],
    ],
  },
  {
    id: "e2", module: "Module 1 · Neural network core", title: "The math of learning: gradient descent & optimizers", minutes: 13,
    sections: [
      { heading: "Skiing down the loss landscape",
        body: "Picture all possible weight settings as a vast mountainous landscape where altitude = loss. Training is skiing downhill blindfolded: backprop tells you the slope (gradient) where you stand; you step in the steepest downhill direction. Step size is the learning rate — the single most important hyperparameter. Too large: you bounce over valleys and the loss explodes to NaN. Too small: training crawls for days. Typical starting points: 1e-3 for Adam, with the right value found by experiment." },
      { heading: "SGD, momentum, and Adam",
        body: "Vanilla SGD (stochastic gradient descent) steps on the gradient of each mini-batch — noisy but effective. Momentum accumulates velocity, smoothing the path and powering through small bumps. Adam (the modern default) adapts the step size per-weight using running averages of gradients — fast, forgiving, excellent out of the box. The pragmatic rule: start with Adam; consider SGD+momentum when squeezing the last fractions of accuracy from vision models.",
        code: `model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"])` },
      { heading: "Learning-rate schedules and warmup",
        body: "Modern training rarely uses a fixed rate. Schedules decay it over time — big exploratory steps early, fine adjustments late. Cosine decay is the popular curve; 'warmup' starts the rate near zero for the first steps to stabilize early chaos (essential for transformers). When a training run plateaus, dropping the learning rate 10× often buys another accuracy jump — the most reliable trick in the deep learning playbook.",
        code: `lr = keras.optimizers.schedules.CosineDecay(
    initial_learning_rate=1e-3, decay_steps=10_000)
opt = keras.optimizers.Adam(learning_rate=lr)` },
    ],
    keyTerms: [
      ["Gradient descent", "Stepping weights downhill on the loss surface"],
      ["Learning rate", "Step size — the most important hyperparameter"],
      ["Adam", "Adaptive optimizer; the modern default"],
      ["LR schedule / warmup", "Planned changes to step size during training"],
    ],
  },
  {
    id: "e3", module: "Module 1 · Neural network core", title: "Building models with TensorFlow & Keras", minutes: 16,
    sections: [
      { heading: "A complete image classifier",
        body: "Keras (TensorFlow's high-level API) lets you define a network as a stack of layers. Here is a real, runnable MNIST digit classifier — paste it into Google Colab and you'll hit ~98% accuracy in two minutes:",
        code: `import tensorflow as tf
from tensorflow import keras

(X_train, y_train), (X_test, y_test) = \\
    keras.datasets.mnist.load_data()
X_train, X_test = X_train / 255.0, X_test / 255.0

model = keras.Sequential([
    keras.layers.Flatten(input_shape=(28, 28)),
    keras.layers.Dense(128, activation="relu"),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(10, activation="softmax"),
])

model.compile(optimizer="adam",
              loss="sparse_categorical_crossentropy",
              metrics=["accuracy"])

model.fit(X_train, y_train, epochs=5,
          validation_split=0.1)
model.evaluate(X_test, y_test)` },
      { heading: "Reading that code like an expert",
        body: "Flatten turns each 28×28 image into a 784-value vector. Dense(128, relu) is the hidden layer doing the pattern-finding. Dropout(0.2) randomly silences 20% of units each step — regularization that fights overfitting. Softmax converts the final 10 outputs into class probabilities. The pixel division by 255 normalizes inputs to 0–1 — networks train far better on small, centered values. validation_split=0.1 holds out data so you can watch for overfitting live." },
      { heading: "Callbacks: training on autopilot",
        body: "Callbacks hook into the training loop. EarlyStopping halts when validation loss stops improving and restores the best weights — your defense against both overfitting and wasted compute. ModelCheckpoint saves the best model as it appears. ReduceLROnPlateau drops the learning rate when progress stalls. Together they make training largely self-driving.",
        code: `cbs = [
  keras.callbacks.EarlyStopping(patience=3,
      restore_best_weights=True),
  keras.callbacks.ModelCheckpoint("best.keras",
      save_best_only=True),
]
model.fit(X_train, y_train, epochs=50,
          validation_split=0.1, callbacks=cbs)` },
    ],
    keyTerms: [
      ["Keras Sequential", "A model as an ordered stack of layers"],
      ["Dropout", "Randomly disabling units to prevent overfitting"],
      ["Normalization", "Scaling inputs to small ranges (e.g., 0–1)"],
      ["EarlyStopping", "Auto-halt when validation stops improving"],
    ],
  },
  /* ---------- MODULE 2: ARCHITECTURES ---------- */
  {
    id: "e4", module: "Module 2 · Architectures", title: "CNNs in depth: how machines see", minutes: 14,
    sections: [
      { heading: "Convolutions: sliding pattern detectors",
        body: "A convolutional layer slides small learnable filters (e.g., 3×3) across the image; each filter fires where its pattern appears — one learns vertical edges, another a patch of fur. Two superpowers over Dense layers: translation invariance (a cat detector works anywhere in the frame) and parameter sharing (one 3×3 filter = 9 weights reused everywhere, versus millions for Dense on raw pixels). Pooling layers then shrink the map, keeping the strongest activations and adding robustness to small shifts." },
      { heading: "A real CNN for CIFAR-10",
        body: "The classic pattern stacks Conv→Conv→Pool blocks with growing filter counts (32→64→128) as spatial size shrinks — trading where-information for what-information — then flattens into Dense layers for classification:",
        code: `model = keras.Sequential([
    keras.layers.Conv2D(32, 3, activation="relu",
        padding="same", input_shape=(32, 32, 3)),
    keras.layers.MaxPooling2D(),
    keras.layers.Conv2D(64, 3, activation="relu",
        padding="same"),
    keras.layers.MaxPooling2D(),
    keras.layers.Conv2D(128, 3, activation="relu",
        padding="same"),
    keras.layers.GlobalAveragePooling2D(),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(10, activation="softmax"),
])` },
      { heading: "Data augmentation: free training data",
        body: "Flip, rotate, shift, and zoom your training images randomly each epoch and the network sees 'new' examples forever — one of the highest-impact regularizers in vision. Keras builds it into the model itself so augmentation runs on-GPU. Standard recipe: random flips + small rotations + slight zoom; never augment the test set.",
        code: `augment = keras.Sequential([
    keras.layers.RandomFlip("horizontal"),
    keras.layers.RandomRotation(0.1),
    keras.layers.RandomZoom(0.1),
])
# place as the first layer of your model` },
    ],
    keyTerms: [
      ["Convolution", "Sliding learnable filters across an image"],
      ["Pooling", "Downsampling that keeps strongest activations"],
      ["Translation invariance", "Detecting patterns regardless of position"],
      ["Data augmentation", "Random image transforms as free extra data"],
    ],
  },
  {
    id: "e5", module: "Module 2 · Architectures", title: "Sequences: RNNs, LSTMs, and why transformers won", minutes: 12,
    sections: [
      { heading: "Recurrent networks: memory in a loop",
        body: "Language, audio, and sensor data are sequences — order matters. RNNs (recurrent neural networks) process one step at a time, passing a hidden 'memory' state forward. Elegant, but plain RNNs forget quickly: gradients vanish across long sequences, so by word 50 the network barely remembers word 1. LSTMs (Long Short-Term Memory) fixed this with learnable gates controlling what to remember, forget, and output — and powered the 2014–2017 era of translation and Siri-class speech recognition." },
      { heading: "The fatal bottleneck",
        body: "RNNs have a structural flaw no gating could fix: they're sequential. Step 500 can't compute until step 499 finishes, so they can't exploit GPUs' massive parallelism, making training on internet-scale text impossibly slow. They also squeeze a whole sentence's meaning through one fixed-size memory vector — a garden hose for an ocean of context. The field needed an architecture that looks at everything at once." },
      { heading: "Attention: everything, everywhere, all at once",
        body: "The 2017 Transformer replaced recurrence with self-attention: every token directly computes relevance scores against every other token and gathers information from the ones that matter. Long-range connections are one hop instead of 500 steps, and everything computes in parallel — perfect for GPUs. Trained on enough text, transformers scale where RNNs choked. LSTMs still appear in small embedded systems, but the modern sequence answer is: transformer." },
    ],
    keyTerms: [
      ["RNN", "Network processing sequences step-by-step with memory"],
      ["LSTM", "Gated RNN that remembers across long sequences"],
      ["Vanishing gradient", "Learning signal fading across many steps"],
      ["Self-attention", "Each token directly attending to all others"],
    ],
  },
  {
    id: "e6", module: "Module 2 · Architectures", title: "Transformers under the hood", minutes: 15,
    sections: [
      { heading: "Queries, keys, values",
        body: "For each token, the model computes three vectors: a Query ('what am I looking for?'), a Key ('what do I contain?'), and a Value ('what information do I offer?'). Attention scores = each query dotted against every key, softmaxed into weights, used to blend the values. In 'The animal didn't cross the road because it was tired', the query for 'it' matches the key for 'animal' — meaning flows accordingly. Multi-head attention runs many such searches in parallel: one head tracking grammar, another coreference, another nearby words." },
      { heading: "Position, stacking, and the LLM recipe",
        body: "Attention alone is order-blind — 'dog bites man' would equal 'man bites dog' — so positional encodings inject each token's location. A transformer 'block' is attention + a small feed-forward network, with residual connections and layer normalization keeping deep stacks trainable. Stack dozens to hundreds of blocks, train on next-token prediction over trillions of words: that is, structurally, the entire recipe for GPT and Claude." },
      { heading: "Scaling laws: the bitter lesson, quantified",
        body: "A landmark discovery: model performance improves as smooth, predictable power-laws in three quantities — parameters, data, and compute. This let labs forecast that a 10× bigger training run was worth the cost, and capabilities like few-shot learning 'emerged' as scale grew, often surprising researchers. Scaling laws are why the last five years became a compute arms race — and why GPU access became geopolitics. Whether the curves continue is one of the live questions of the decade." },
    ],
    keyTerms: [
      ["Query / Key / Value", "The three vectors behind attention scores"],
      ["Multi-head attention", "Many parallel attention searches per layer"],
      ["Positional encoding", "Injecting word-order into an order-blind model"],
      ["Scaling laws", "Predictable gains from more parameters/data/compute"],
    ],
  },
  {
    id: "e7", module: "Module 2 · Architectures", title: "Embeddings: how AI represents meaning", minutes: 12,
    sections: [
      { heading: "Meaning as geometry",
        body: "An embedding maps a word, sentence, image, or user into a list of numbers — a point in high-dimensional space — such that similar things land near each other. The famous demo: vector('king') − vector('man') + vector('woman') ≈ vector('queen'). Directions in the space encode concepts like gender, tense, even capital-of. Every transformer's first layer is an embedding lookup; in a real sense, embeddings are the native language of neural networks." },
      { heading: "Semantic search and similarity",
        body: "Embed two texts and measure cosine similarity between their vectors: high score = similar meaning, even with zero shared words ('How do I reset my password?' matches 'Steps to recover account access'). This powers semantic search, recommendation ('users near you in embedding space liked...'), duplicate detection, and clustering documents by topic. Embedding APIs (OpenAI, Anthropic-adjacent providers, open-source models) make this a few lines of code." },
      { heading: "Vector databases and RAG",
        body: "Embed your entire document library and store the vectors in a vector database (Pinecone, Chroma, pgvector). When a user asks a question: embed the question, retrieve the nearest chunks, and paste them into an LLM's prompt to answer from. That pipeline is RAG — Retrieval-Augmented Generation — the architecture behind nearly every 'chat with your company's documents' product, and the most employable LLM skill of the moment. You now know all three of its components: embeddings, vector search, and prompting." },
    ],
    keyTerms: [
      ["Embedding", "Numeric vector representing meaning"],
      ["Cosine similarity", "Closeness measure between two vectors"],
      ["Vector database", "Storage optimized for nearest-vector search"],
      ["RAG", "Retrieve relevant chunks, then generate the answer"],
    ],
  },
  /* ---------- MODULE 3: THE FRONTIER ---------- */
  {
    id: "e8", module: "Module 3 · The frontier", title: "Transfer learning & fine-tuning", minutes: 13,
    sections: [
      { heading: "Stand on a million shoulders",
        body: "Modern practitioners rarely train from zero. Transfer learning takes a model pre-trained on millions of images (MobileNetV2, ResNet, EfficientNet) or billions of words, freezes its learned feature extractors, and trains only a small new head on your data. State-of-the-art results from a few thousand examples — where training from scratch would hopelessly overfit.",
        code: `base = keras.applications.MobileNetV2(
    input_shape=(160, 160, 3),
    include_top=False, weights="imagenet")
base.trainable = False  # freeze learned features

model = keras.Sequential([
    base,
    keras.layers.GlobalAveragePooling2D(),
    keras.layers.Dense(1, activation="sigmoid"),
])` },
      { heading: "Two-stage fine-tuning",
        body: "The professional recipe: Stage 1 — train only your new head until it converges. Stage 2 — unfreeze the top portion of the base model and continue with a tiny learning rate (1e-5), gently adapting high-level features to your domain without destroying the pre-trained knowledge ('catastrophic forgetting'). For LLMs, parameter-efficient methods like LoRA fine-tune by training small added matrices — under 1% of the weights — making customization of huge models feasible on a single GPU." },
      { heading: "The Hugging Face workflow",
        body: "Hugging Face hosts hundreds of thousands of pre-trained models. The transformers library makes using or fine-tuning them a few lines — and checking the Hub for an existing model should precede any plan to train your own.",
        code: `from transformers import pipeline

clf = pipeline("sentiment-analysis")
print(clf("This course is incredible!"))
# [{'label': 'POSITIVE', 'score': 0.9998}]

# Fine-tuning: load any model + Trainer API
# on your labeled examples — same pattern.` },
    ],
    keyTerms: [
      ["Transfer learning", "Reusing a pre-trained model on a new task"],
      ["Catastrophic forgetting", "Destroying pre-trained knowledge by overtraining"],
      ["LoRA", "Fine-tuning via small added matrices — cheap and fast"],
      ["Hugging Face Hub", "The library of the world's pre-trained models"],
    ],
  },
  {
    id: "e9", module: "Module 3 · The frontier", title: "How LLMs are actually made", minutes: 14,
    sections: [
      { heading: "Stage 1 — pretraining: compress the internet",
        body: "A base LLM is trained on one task at absurd scale: predict the next token across trillions of words of web text, books, and code, for months, on thousands of GPUs, at costs from tens of millions to over a hundred million dollars. The result knows grammar, facts, reasoning patterns, and 100 programming languages — but it's a wild autocomplete, not an assistant. Ask it a question and it might continue with three more questions, because that's what internet text often does." },
      { heading: "Stage 2 — instruction tuning + RLHF: taming the model",
        body: "Next, supervised fine-tuning on tens of thousands of high-quality (instruction → ideal response) examples teaches the format of being helpful. Then RLHF — Reinforcement Learning from Human Feedback: humans rank pairs of model responses, a 'reward model' learns those preferences, and the LLM is optimized against it. Anthropic adds Constitutional AI, where the model critiques and revises its own outputs against written principles. This alignment stage is the difference between raw GPT and ChatGPT — same knowledge, transformed behavior." },
      { heading: "Stage 3 — inference: what happens when you hit send",
        body: "Your prompt is tokenized, flows through every transformer layer, and produces a probability for every possible next token; one is sampled ('temperature' controls how adventurously), appended, and the loop repeats — your answer generates one token at a time, which is why responses stream. Modern additions: 'reasoning' models trained to think in long hidden chains before answering, and tool use, where the model emits structured calls to search engines, code interpreters, or APIs mid-response. You've used both in this app." },
    ],
    keyTerms: [
      ["Pretraining", "Next-token prediction over trillions of words"],
      ["Instruction tuning", "Fine-tuning on (instruction → response) pairs"],
      ["RLHF", "Optimizing the model against human preference rankings"],
      ["Temperature", "Sampling randomness: low = focused, high = creative"],
      ["Tool use", "The model calling search/code/APIs mid-answer"],
    ],
  },
  {
    id: "e10", module: "Module 3 · The frontier", title: "Generative models: diffusion and GANs", minutes: 12,
    sections: [
      { heading: "GANs: the forger and the detective",
        body: "Generative Adversarial Networks (2014) train two networks against each other: a generator forging images from noise, and a discriminator judging real vs. fake. Each makes the other better until forgeries fool the detective. GANs created the first photorealistic fake faces (thispersondoesnotexist.com) and powered the deepfake era — but they're notoriously unstable to train and prone to 'mode collapse' (producing one convincing output forever)." },
      { heading: "Diffusion: sculpting images out of noise",
        body: "Diffusion models — behind DALL·E, Midjourney, and Stable Diffusion — learn by destruction: take real images, add noise step by step until pure static, and train a network to reverse each step. Generation runs the film backwards: start from random noise and denoise iteratively (typically 20–50 steps) into a coherent image. Stabler than GANs, with diversity and quality that ended the GAN era of image generation almost overnight in 2022." },
      { heading: "Steering the noise: conditioning and latent space",
        body: "Text guidance works by conditioning each denoising step on your prompt's embedding (from a text encoder like CLIP) — 'guidance scale' controls how strictly the image obeys the words. Stable Diffusion's other trick: diffuse in a compressed 'latent' space (64×64) instead of pixel space (512×512), slashing compute ~50× and putting image generation on consumer GPUs. Video models like Sora extend the same idea across time — denoising entire clips with temporal attention keeping frames consistent." },
    ],
    keyTerms: [
      ["GAN", "Generator vs. discriminator, trained adversarially"],
      ["Diffusion model", "Generate by iteratively denoising random noise"],
      ["Guidance scale", "How strictly generation follows the prompt"],
      ["Latent diffusion", "Diffusing in compressed space for ~50× speedup"],
    ],
  },
  {
    id: "e11", module: "Module 3 · The frontier", title: "MLOps, evals, and responsible AI", minutes: 13,
    sections: [
      { heading: "Production deep learning: the MLOps stack",
        body: "Shipping a model is the start, not the finish. The production stack: experiment tracking (Weights & Biases, MLflow) recording every run's config and metrics; model registries versioning deployable artifacts; serving infrastructure (TensorFlow Serving, ONNX Runtime for cross-framework portability) with quantization shrinking models 4× for phones and edge devices; and monitoring for data drift, latency, and silent accuracy decay. Interviews for ML engineering roles probe this material as hard as the modeling." },
      { heading: "Evals: the discipline of measuring LLMs",
        body: "How do you test a model whose output is open-ended text? 'Evals' are the answer and one of the hottest skills in AI. Approaches: benchmark suites (MMLU for knowledge, HumanEval for code); golden datasets of your own real cases with expected behaviors; LLM-as-judge, where a strong model grades outputs against a rubric; and A/B tests on live traffic. Teams that ship reliable AI products are, above all, teams with good evals — vibes don't scale." },
      { heading: "Alignment and your responsibility",
        body: "Frontier-AI safety research tackles: models 'hallucinating' confidently, reward hacking (optimizing the metric, not the intent), jailbreaks bypassing safeguards, and interpretability — opening the black box to see what billions of weights actually compute. Practitioner-level responsibility is concrete: evaluate your model's errors across demographic groups, document intended use and limits (model cards), keep humans in the loop for consequential decisions, and red-team your own systems before someone else does. The engineers who take this seriously are the ones trusted with the important systems." },
    ],
    keyTerms: [
      ["Experiment tracking", "Logging every run's config, code, and metrics"],
      ["Quantization", "Shrinking models (e.g., float32→int8) for deployment"],
      ["Evals / LLM-as-judge", "Systematic testing of open-ended AI output"],
      ["Red-teaming", "Adversarially attacking your own system to find failures"],
      ["Model card", "Documentation of a model's intended use and limits"],
    ],
  },
];

/* ===================== LESSON EXERCISES ===================== */
/* One runnable exercise per lesson — tied by lesson id */

const LESSON_EXERCISES = {
  b1: [
    { id:"b1e1", title:"AI fact file",
      prompt:"Create three variables — what AI is, what it can do, and what it cannot do — then print each as a sentence.",
      starter:`ai_is     = "software that finds patterns in data"
ai_can    = "recognize faces, translate languages, recommend movies"
ai_cannot = "truly understand, feel, or be conscious"

print("AI is:", ai_is)
# Add two more print lines below
`,
      hint:'print("AI can:", ai_can) then print("AI cannot:", ai_cannot)' },
    { id:"b1e2", title:"Narrow AI classifier",
      prompt:"Loop over the tasks list. For each one a narrow AI can handle, print '→ AI CAN'. Otherwise print '→ needs a human'.",
      starter:`tasks    = ["translate Spanish","feel empathy","play chess","spot a tumor in an X-ray","cook breakfast"]
ai_tasks = ["translate Spanish","play chess","spot a tumor in an X-ray"]

for task in tasks:
    if task in ai_tasks:
        print(task, "→ AI CAN")
    else:
        pass  # replace pass with a print statement
`,
      hint:'Replace pass with: print(task, "→ needs a human")' },
  ],
  b2: [
    { id:"b2e1", title:"AI timeline dictionary",
      prompt:"Create a dictionary where keys are years and values are AI milestones. Add 2012 and 2022 entries, then loop over it printing each.",
      starter:`timeline = {
    "1950": "Alan Turing proposes the Turing Test",
    "1997": "Deep Blue beats world chess champion Kasparov",
    # Add: "2012": "AlexNet wins ImageNet — deep learning era begins"
    # Add: "2022": "ChatGPT reaches 100M users in 2 months"
}

for year, event in timeline.items():
    print(year + ":", event)
`,
      hint:'"2012": "AlexNet wins ImageNet — deep learning era begins", "2022": "ChatGPT reaches 100M users in 2 months"' },
    { id:"b2e2", title:"AI winter detector",
      prompt:"An AI winter happens when hype far outpaces progress. Print 'AI WINTER' if hype > progress * 2, otherwise 'steady progress'.",
      starter:`periods = [
    ("1970s", 7, 2),
    ("1980s", 8, 3),
    ("1990s", 4, 5),
    ("2020s", 9, 8),
]

for era, hype, progress in periods:
    if hype > progress * 2:
        print(era + ": AI WINTER")
    else:
        print(era + ": steady progress")
`,
      hint:"The code is complete — run it! Try adjusting the numbers to create or remove AI winters." },
  ],
  b3: [
    { id:"b3e1", title:"Simulate training (gradient descent mini)",
      prompt:"Training nudges predictions toward the right answer. Start at 0.0, loop 6 steps adjusting 20% toward the target of 1.0, and print each step.",
      starter:`target        = 1.0
prediction    = 0.0
learning_rate = 0.2

for step in range(1, 7):
    error      = target - prediction
    prediction = prediction + learning_rate * error
    print(f"Step {step}: prediction = {prediction:.3f}")
`,
      hint:"The code is complete — run it and watch the prediction converge toward 1.0. This is exactly what neural network training does, scaled to billions of weights." },
    { id:"b3e2", title:"Next-word predictor",
      prompt:"Build a tiny next-word predictor from a patterns dictionary. If a phrase is found, print the predicted next word. If not, say 'unknown'.",
      starter:`patterns = {
    "the capital of France is": "Paris",
    "machine learning finds": "patterns",
    "AI cannot truly": "understand",
}

tests = [
    "the capital of France is",
    "machine learning finds",
    "what is the meaning of life",
]

for phrase in tests:
    if phrase in patterns:
        print(f'"{phrase}" → "{patterns[phrase]}"')
    else:
        print(f'"{phrase}" → [unknown — no pattern found]')
`,
      hint:"Run it, then add your own phrase to patterns and test it." },
  ],
  b4: [
    { id:"b4e1", title:"Context window calculator",
      prompt:"Convert context window sizes from tokens to approximate words (×0.75) and pages (÷250). Print a comparison table.",
      starter:`models = {
    "GPT-3.5":      16_000,
    "Claude Sonnet":200_000,
    "GPT-4o":       128_000,
}

print(f"{'Model':<18} {'Tokens':>8} {'~Words':>8} {'~Pages':>7}")
print("-" * 45)
for model, tokens in models.items():
    words = int(tokens * 0.75)
    pages = int(words / 250)
    print(f"{model:<18} {tokens:>8,} {words:>8,} {pages:>7,}")
`,
      hint:"Run it. Try adding Gemini 1.5 with 1,000,000 tokens." },
  ],
  b5: [
    { id:"b5e1", title:"AI tool organizer",
      prompt:"Filter the tools list to print image tools first, then all other categories.",
      starter:`tools = [
    ("Midjourney",  "image", "Best artistic quality"),
    ("Suno",        "music", "Full songs from text"),
    ("DALL-E",      "image", "Built into ChatGPT"),
    ("ElevenLabs",  "voice", "Realistic voice cloning"),
    ("Runway",      "video", "Text-to-video"),
    ("Stable Diff.","image", "Free, open-source"),
]

print("=== Image tools ===")
for name, cat, desc in tools:
    if cat == "image":
        print(f"  • {name}: {desc}")

print("\n=== Other modalities ===")
# Add your loop here for non-image tools
`,
      hint:'for name, cat, desc in tools:\n    if cat != "image":\n        print(f"  • {name} ({cat}): {desc}")' },
  ],
  b6: [
    { id:"b6e1", title:"Engagement score model",
      prompt:"Score each video: score = watch_time - skip_rate × 30. Sort and print a ranked recommendation list.",
      starter:`videos = [
    ("Cat video",   95,  0.1),
    ("News clip",   30,  0.6),
    ("Tutorial",    180, 0.05),
    ("Ad",          5,   0.9),
    ("Music video", 120, 0.2),
]

scored = []
for title, watch_time, skip_rate in videos:
    score = watch_time - skip_rate * 30
    scored.append((score, title))

scored.sort(reverse=True)

print("Recommendation ranking:")
for rank, (score, title) in enumerate(scored, 1):
    print(f"  {rank}. {title}  (score: {score:.1f})")
`,
      hint:"Run it. Notice the ad ranks last — its skip_rate destroys the score. This mirrors how real feed algorithms work." },
  ],
  b7: [
    { id:"b7e1", title:"Simulate an AI agent",
      prompt:"Write an agent() function that takes a goal, looks it up in a steps dictionary, and prints each planned action. Add your own goal to the dictionary.",
      starter:`def agent(goal):
    steps_for = {
        "book a flight":  ["Search flights","Compare prices","Check seat availability","Confirm booking"],
        "send an email":  ["Draft message","Check recipient","Review content","Send"],
    }
    print(f"Agent received: {goal!r}")
    if goal in steps_for:
        for i, step in enumerate(steps_for[goal], 1):
            print(f"  Step {i}: {step}")
    else:
        print("  [Goal not in knowledge base — escalating to human]")
    print()

agent("book a flight")
agent("order pizza")       # not in the dict — what happens?
# Add your own goal to steps_for, then call agent() with it
`,
      hint:'Add "order pizza": ["Browse menu","Add to cart","Enter address","Pay","Wait"] to steps_for and rerun.' },
  ],
  b8: [
    { id:"b8e1", title:"Prompt builder function",
      prompt:"Write a build_prompt(role, task, context, format) function that assembles a structured prompt string. Call it with two different scenarios.",
      starter:`def build_prompt(role, task, context, output_format):
    return f"""You are {role}.
Task: {task}
Context: {context}
Format: {output_format}"""

p1 = build_prompt(
    role="an experienced teacher",
    task="explain gradient descent",
    context="to a high school student with no math background",
    output_format="3 bullet points, no equations"
)
print("=== Prompt 1 ===")
print(p1)

# Write p2 below — try a doctor explaining an MRI result
print("\n=== Prompt 2 ===")
# p2 = build_prompt(...)
# print(p2)
`,
      hint:'p2 = build_prompt(role="a doctor", task="explain an MRI result", context="to a worried patient", output_format="plain language, 2 short paragraphs")' },
  ],
  b9: [
    { id:"b9e1", title:"SIFT method checker",
      prompt:"Print the SIFT checklist (Stop / Investigate / Find / Trace) for any headline. Then add a check for emotional language as a red flag.",
      starter:`def sift_check(headline):
    print(f'Checking: "{headline}"')
    steps = [
        ("STOP",       "Am I about to share this before checking?"),
        ("INVESTIGATE","Who published this? Is the source credible?"),
        ("FIND",       "Do other reliable outlets report the same story?"),
        ("TRACE",      "Can I find the original source of this claim?"),
    ]
    for step, question in steps:
        print(f"  [{step}] {question}")

    # Bonus: flag emotional language
    red_flags = ["SHOCKING","BREAKING","YOU WON'T BELIEVE","EXPOSED"]
    found = [f for f in red_flags if f in headline.upper()]
    if found:
        print(f"  ⚠️  Emotional trigger words: {found}")
    print()

sift_check("SHOCKING: AI will take ALL jobs by next year!")
sift_check("New study links social media to teen anxiety")
`,
      hint:"Run it. Then call sift_check() with a headline you've seen recently to practice the method." },
  ],
  b10: [
    { id:"b10e1", title:"Privacy risk scanner",
      prompt:"Write a privacy_risk(text) function that checks for sensitive keywords and prints HIGH / MEDIUM / LOW risk with a reason.",
      starter:`def privacy_risk(text):
    sensitive = ["password","ssn","social security","credit card",
                 "bank account","medical record","diagnosis"]
    text_lower = text.lower()
    found = [w for w in sensitive if w in text_lower]

    if found:
        print(f"🚨 HIGH — found sensitive data: {found}")
        print("   Do NOT paste into a consumer AI tool.")
    elif len(text.split()) > 100:
        print("⚠️  MEDIUM — large text block. Check carefully for names/numbers.")
    else:
        print("✅ LOW — looks safe to use.")
    print()

privacy_risk("Can you help me refactor this Python function?")
privacy_risk("My SSN is 123-45-6789 and bank account is 9876.")
privacy_risk("Patient John Smith, diagnosis: type 2 diabetes.")
`,
      hint:"Run it, then add 'passport', 'salary', or 'birth date' to the sensitive list." },
  ],
  i1: [
    { id:"i1e1", title:"Train/test split from scratch",
      prompt:"Without sklearn: shuffle 20 items with a fixed seed, split 80/20, and print the size and first few items of each set.",
      starter:`import random
random.seed(42)
data = list(range(1, 21))
random.shuffle(data)

split = int(len(data) * 0.8)
train, test = data[:split], data[split:]

print("Train:", len(train), "→", train[:5], "...")
print("Test: ", len(test),  "→", test)
print(f"Ratio: {len(train)/len(data):.0%} train / {len(test)/len(data):.0%} test")
`,
      hint:"Run it. Change random.seed() to see different shuffles. The split ratio stays the same regardless." },
  ],
  i2: [
    { id:"i2e1", title:"Median imputation by hand",
      prompt:"Fill missing (None) income values with the median of the present values. Print the repaired list.",
      starter:`incomes = [48000, None, 52000, 61000, None, 45000, 58000]

present = sorted(x for x in incomes if x is not None)
median  = present[len(present) // 2]

repaired = [x if x is not None else median for x in incomes]
print("Original:", incomes)
print("Repaired:", repaired)
print("Median used:", median)
`,
      hint:"Run it. Then try using the mean instead of the median and see how outliers affect the imputed values." },
  ],
  i3: [
    { id:"i3e1", title:"Engineer features from a date",
      prompt:"Extract day-of-week, is_weekend, and a price-per-sqft feature from each record. Print a neat table.",
      starter:`from datetime import datetime

listings = [
    {"date":"2025-03-15","price":450000,"sqft":1500},
    {"date":"2025-03-16","price":320000,"sqft":1100},
    {"date":"2025-03-17","price":680000,"sqft":2200},
]

for row in listings:
    dt = datetime.strptime(row["date"], "%Y-%m-%d")
    row["day"]           = dt.strftime("%A")
    row["is_weekend"]    = dt.weekday() >= 5
    row["price_per_sqft"]= round(row["price"] / row["sqft"], 2)

print(f"{'Date':<12} {'Day':<10} {'Weekend':<9} {'$/sqft'}")
print("-" * 44)
for r in listings:
    print(f"{r['date']:<12} {r['day']:<10} {str(r['is_weekend']):<9} {r['price_per_sqft']}")
`,
      hint:"Run it. Then add a 'price_tier' feature: 'luxury' if price > 500000, else 'standard'." },
  ],
  i4: [
    { id:"i4e1", title:"EDA stats without libraries",
      prompt:"Compute mean, min, max, and std for three numeric columns — using only pure Python. Print a summary table.",
      starter:`import math

scores = [
    {"quiz":72,"project":88,"final":79},
    {"quiz":91,"project":95,"final":93},
    {"quiz":65,"project":70,"final":68},
    {"quiz":83,"project":85,"final":80},
    {"quiz":55,"project":60,"final":58},
]

def stats(col):
    vals = [r[col] for r in scores]
    mean = sum(vals)/len(vals)
    std  = math.sqrt(sum((x-mean)**2 for x in vals)/len(vals))
    return mean, min(vals), max(vals), round(std,1)

print(f"{'Col':<10} {'Mean':>6} {'Min':>5} {'Max':>5} {'Std':>6}")
print("-" * 32)
for col in ["quiz","project","final"]:
    m,mn,mx,sd = stats(col)
    print(f"{col:<10} {m:>6.1f} {mn:>5} {mx:>5} {sd:>6}")
`,
      hint:"Run it. Low std = consistent scores. Which column has the most spread? That suggests harder grading or higher variance in understanding." },
  ],
  i5: [
    { id:"i5e1", title:"Linear regression from scratch",
      prompt:"Implement least-squares linear regression (y = mx + b) to predict housing price from square footage. Print the model and 3 predictions.",
      starter:`sqft  = [800,1000,1200,1500,1800,2000,2500]
price = [180, 230, 260, 310, 380, 420, 500]   # $k

n      = len(sqft)
sum_x  = sum(sqft);  sum_y  = sum(price)
sum_xy = sum(x*y for x,y in zip(sqft,price))
sum_xx = sum(x*x for x in sqft)

m = (n*sum_xy - sum_x*sum_y) / (n*sum_xx - sum_x**2)
b = (sum_y - m*sum_x) / n

print(f"Model: price = {m:.4f} × sqft + {b:.2f}")
for s in [900, 1300, 2200]:
    print(f"  {s:,} sqft → \${m*s+b:.0f}k predicted")
`,
      hint:"Run it. The slope tells you: each extra sqft adds about $m thousand. Try plotting on paper by drawing the line through your data points." },
  ],
  i6: [
    { id:"i6e1", title:"KNN classifier from scratch",
      prompt:"Implement 3-nearest-neighbor classification using Euclidean distance. Classify new points by majority vote of their 3 closest training examples.",
      starter:`import math

def dist(a, b):
    return math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)

train = [((1,2),"A"),((2,3),"A"),((3,1),"A"),
         ((7,7),"B"),((8,6),"B"),((6,8),"B")]

def knn(point, k=3):
    neighbors = sorted([(dist(point,pt),label) for pt,label in train])[:k]
    votes = {}
    for _,label in neighbors:
        votes[label] = votes.get(label,0) + 1
    return max(votes, key=votes.get)

for pt in [(2,2),(7,6),(4,4),(5,5)]:
    print(f"Point {pt} → class '{knn(pt)}'")
`,
      hint:"Run it. The point (4,4) is in-between — which class wins? Try changing k=1 or k=5 and see if it changes." },
  ],
  i7: [
    { id:"i7e1", title:"K-means: one full iteration",
      prompt:"Assign each point to its nearest centroid, then recompute centroids. Run 4 iterations and watch them stabilize.",
      starter:`import math

def dist(a,b): return math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2)

points    = [(1,1),(1,2),(2,1),(2,2),(8,8),(8,9),(9,8),(9,9),(5,5)]
centroids = [(2,2),(8,8)]

for it in range(4):
    clusters = [[] for _ in centroids]
    for p in points:
        nearest = min(range(len(centroids)), key=lambda i: dist(p,centroids[i]))
        clusters[nearest].append(p)
    centroids = [(round(sum(p[0] for p in c)/len(c),1),
                  round(sum(p[1] for p in c)/len(c),1)) for c in clusters]
    print(f"Iter {it+1}: centroids = {centroids}")

print("Final clusters:")
clusters = [[] for _ in centroids]
for p in points:
    clusters[min(range(len(centroids)), key=lambda i: dist(p,centroids[i]))].append(p)
for i,c in enumerate(clusters): print(f"  Cluster {i+1}: {c}")
`,
      hint:"Run it. Which cluster does (5,5) fall into? Try adding a third centroid at (5,5) initially and see what happens with k=3." },
  ],
  i8: [
    { id:"i8e1", title:"Precision, recall, F1 from scratch",
      prompt:"Compute TP, FP, FN, TN from two lists, then calculate precision, recall, and F1. Print a formatted summary.",
      starter:`y_true = [1,0,1,1,0,1,0,0,1,1,0,1,0,1,0]
y_pred = [1,0,0,1,0,1,1,0,1,0,0,1,0,0,1]

tp = sum(1 for t,p in zip(y_true,y_pred) if t==1 and p==1)
fp = sum(1 for t,p in zip(y_true,y_pred) if t==0 and p==1)
fn = sum(1 for t,p in zip(y_true,y_pred) if t==1 and p==0)
tn = sum(1 for t,p in zip(y_true,y_pred) if t==0 and p==0)

prec = tp/(tp+fp) if tp+fp else 0
rec  = tp/(tp+fn) if tp+fn else 0
f1   = 2*prec*rec/(prec+rec) if prec+rec else 0

print(f"TP={tp}  FP={fp}  FN={fn}  TN={tn}")
print(f"Precision: {prec:.3f}  Recall: {rec:.3f}  F1: {f1:.3f}")
`,
      hint:"Run it. Try changing a few predictions and watch how precision vs recall trade off against each other." },
  ],
  i9: [
    { id:"i9e1", title:"5-fold cross-validation from scratch",
      prompt:"Split 50 items into 5 folds, hold each out as test in turn, score each fold with a simple rule, and report mean ± std.",
      starter:`import math, random
random.seed(42)
data = [(random.random(), random.choice([0,1])) for _ in range(50)]

k, fold_size = 5, 10
accs = []
for fold in range(k):
    test  = data[fold*fold_size:(fold+1)*fold_size]
    train = data[:fold*fold_size] + data[(fold+1)*fold_size:]
    correct = sum(1 for x,y in test if (1 if x>0.5 else 0)==y)
    accs.append(correct/len(test))
    print(f"Fold {fold+1}: {accs[-1]:.3f}")

mean = sum(accs)/k
std  = math.sqrt(sum((a-mean)**2 for a in accs)/k)
print(f"\nMean ± Std: {mean:.3f} ± {std:.3f}")
`,
      hint:"Run it. The classifier is random so ≈50% is expected. Large std = unstable results. Change random.seed() to see different variance." },
  ],
  i10: [
    { id:"i10e1", title:"Model version registry",
      prompt:"Simulate a model registry: save versions with metadata, promote one to production, and load the current production model.",
      starter:`registry = {}

def save_model(name, version, accuracy, notes=""):
    key = f"{name}_v{version}"
    registry[key] = {"name":name,"version":version,"accuracy":accuracy,"notes":notes}
    print(f"Saved: {key}  acc={accuracy:.3f}  {notes}")

def promote(key):
    registry["PRODUCTION"] = key
    print(f"✓ Promoted {key} to PRODUCTION")

def load():
    key = registry.get("PRODUCTION")
    m = registry.get(key) if key else None
    if m: print(f"Loaded production: {m['name']} v{m['version']}  acc={m['accuracy']:.3f}")
    else: print("No production model!")

save_model("churn", 1, 0.78, "baseline logistic regression")
save_model("churn", 2, 0.84, "added feature engineering")
save_model("churn", 3, 0.87, "random forest 200 trees")
promote("churn_v3")
print()
load()
`,
      hint:"Run it. Try saving a v4 with accuracy 0.82 — should you promote it over v3? Real teams argue this question every week." },
  ],
  e1: [
    { id:"e1e1", title:"Build one neural layer",
      prompt:"Implement a dense layer forward pass: weighted sum of inputs + bias, then apply ReLU. Test with 3 different input vectors.",
      starter:`import math, random
random.seed(7)
relu = lambda x: max(0, x)
dot  = lambda a,b: sum(x*y for x,y in zip(a,b))

n_in, n_out = 3, 4
W = [[random.gauss(0,.5) for _ in range(n_in)] for _ in range(n_out)]
b = [0.0]*n_out

def forward(x):
    return [relu(dot(W[i],x)+b[i]) for i in range(n_out)]

for inp in [[1.0,0.5,-1.0],[0.0,0.0,0.0],[-1.0,2.0,0.5]]:
    out = forward(inp)
    active = sum(1 for v in out if v>0)
    print(f"In: {inp}  Out: {[round(v,3) for v in out]}  ({active}/{n_out} active)")
`,
      hint:"Run it. Notice how ReLU sets negatives to zero — those neurons are 'off'. All-zero input gives all-zero output (dead start — why weights need random initialization)." },
  ],
  e2: [
    { id:"e2e1", title:"Gradient descent on f(x)=(x-3)²",
      prompt:"Find the minimum of f(x)=(x-3)² starting at x=10. The gradient is 2(x-3). Take 20 steps and print the path.",
      starter:`def f(x):    return (x-3)**2
def grad(x): return 2*(x-3)

x  = 10.0
lr = 0.1
print(f"{'Step':<5} {'x':>8} {'f(x)':>8}")
print("-" * 24)
for step in range(1, 21):
    x -= lr * grad(x)
    print(f"{step:<5} {x:>8.4f} {f(x):>8.4f}")
print(f"\nMinimum ≈ {x:.4f}  (true minimum = 3.0)")
`,
      hint:"Run it. Try lr=0.9 (slow convergence) or lr=1.1 (explodes — the NaN/inf problem that kills training runs)." },
  ],
  e3: [
    { id:"e3e1", title:"Implement softmax",
      prompt:"Implement softmax with numerical stability (subtract max before exp). Show how it converts raw logits into probabilities.",
      starter:`import math

def softmax(logits):
    m   = max(logits)
    exp = [math.exp(x-m) for x in logits]
    s   = sum(exp)
    return [e/s for e in exp]

cases = [
    ("balanced",    [2.0,1.0,0.1,0.5,0.2]),
    ("uniform",     [1.0,1.0,1.0,1.0,1.0]),
    ("very sure",   [10.,0.1,0.1,0.1,0.1]),
]

classes = ["cat","dog","bird","fish","hamster"]
for label, logits in cases:
    p  = softmax(logits)
    top = p.index(max(p))
    print(f"{label}: predicts '{classes[top]}' ({max(p)*100:.1f}%)")
    print(f"  probs: {[f'{v:.3f}' for v in p]}  sum={sum(p):.5f}")
`,
      hint:"Run it. Notice the sum is always exactly 1.0. The 'very sure' case collapses nearly all probability onto one class — that's how a confident model behaves." },
  ],
  e4: [
    { id:"e4e1", title:"1D convolution (edge detector)",
      prompt:"Implement a sliding 1D convolution. Apply the edge-detector kernel [-1,0,1] to a signal and print where rising and falling edges are detected.",
      starter:`def conv1d(signal, kernel):
    k = len(kernel)
    return [round(sum(signal[i+j]*kernel[j] for j in range(k)),2)
            for i in range(len(signal)-k+1)]

signal = [0,0,0,1,1,1,1,0,0,0]
kernel = [-1,0,1]
out    = conv1d(signal, kernel)

print("Signal:", signal)
print("Output:", out)
for i,v in enumerate(out):
    if   v > 0: print(f"  pos {i+1}: rising edge  (+{v})")
    elif v < 0: print(f"  pos {i+1}: falling edge ({v})")
`,
      hint:"Run it. In 2D CNNs this same sliding idea runs over millions of pixels in parallel, with hundreds of different learned kernels." },
  ],
  e5: [
    { id:"e5e1", title:"Self-attention scores",
      prompt:"Compute scaled dot-product attention scores: for a query vector, dot it against each key, divide by √d, then softmax. Show the result as a bar chart.",
      starter:`import math

dot     = lambda a,b: sum(x*y for x,y in zip(a,b))
def softmax(v):
    e=[ math.exp(x-max(v)) for x in v]; s=sum(e); return [x/s for x in e]

tokens = ["The","cat","sat","mat"]
keys   = [[1,0,0],[.8,.6,0],[0,.9,.4],[.1,.2,.9]]
query  = [.9,.5,0]
d_k    = len(query)

scores  = [dot(query,k)/math.sqrt(d_k) for k in keys]
weights = softmax(scores)

print(f"{'Token':<8} {'Score':>7} {'Attn':>7}  Bar")
print("-"*38)
for tok,sc,w in zip(tokens,scores,weights):
    bar="█"*int(w*25)
    print(f"{tok:<8} {sc:>7.3f} {w:>7.3f}  {bar}")
`,
      hint:"Run it. The query (representing 'cat') attends most to itself. Try changing the query vector to point toward [0,0,1] and see which token gets the most attention." },
  ],
  e6: [
    { id:"e6e1", title:"Sinusoidal positional encoding",
      prompt:"Implement the Transformer positional encoding formula: PE(pos,2i)=sin(pos/10000^(2i/d)), PE(pos,2i+1)=cos(...). Encode positions 0-5.",
      starter:`import math

def pos_enc(pos, d_model=8):
    pe = []
    for i in range(0, d_model, 2):
        pe.append(round(math.sin(pos/(10000**(i/d_model))),3))
        if i+1<d_model:
            pe.append(round(math.cos(pos/(10000**(i/d_model))),3))
    return pe[:d_model]

print(f"{'Pos':<4}", end="")
for d in range(8): print(f" d{d:>2}", end="")
print()
print("-"*(4+5*8))
for pos in range(6):
    pe = pos_enc(pos)
    print(f"{pos:<4}", end="")
    for v in pe: print(f" {v:>4}", end="")
    print()
print("\nEach column cycles at a different frequency — unique fingerprint per position.")
`,
      hint:"Run it. Notice dim 0-1 change fast, dim 6-7 barely change across positions. The model learns to read these patterns as 'position 3 vs position 4'." },
  ],
  e7: [
    { id:"e7e1", title:"Semantic search with cosine similarity",
      prompt:"Implement cosine similarity and find the closest sentence to a query from a small set — zero shared words, but high semantic overlap.",
      starter:`import math

def cos_sim(a,b):
    dot = sum(x*y for x,y in zip(a,b))
    return dot/(math.sqrt(sum(x**2 for x in a))*math.sqrt(sum(x**2 for x in b)))

# dim: [tech, animals, food, support]
docs = {
    "How do I reset my password?":     [.8,.0,.0,.9],
    "Steps to recover account access": [.9,.0,.0,.8],
    "My dog won't eat his food":       [.0,.9,.8,.2],
    "Python tutorial for beginners":   [.9,.0,.1,.6],
    "Best homemade pizza recipe":      [.1,.0,1.,.0],
}

query_emb = [.7,.0,.0,.9]  # "I forgot my login credentials"
results = sorted([(cos_sim(query_emb,emb),txt) for txt,emb in docs.items()],reverse=True)

print('Query: "I forgot my login credentials"\n')
for score,txt in results:
    bar="█"*int(score*20)
    print(f"{score:.3f}  {bar}  {txt}")
`,
      hint:"Run it. Zero shared words between query and top result, yet cosine similarity is highest. This is exactly how semantic search engines work." },
  ],
  e8: [
    { id:"e8e1", title:"LoRA forward pass",
      prompt:"Implement the LoRA forward pass: output = W·x + scale·(B·A·x). Compare parameter counts between full weight matrix and LoRA.",
      starter:`import random; random.seed(0)
def mv(M,v): return [sum(M[i][j]*v[j] for j in range(len(v))) for i in range(len(M))]
def add_scaled(a,b,s): return [x+s*y for x,y in zip(a,b)]

dim, rank = 4, 2
W = [[random.gauss(0,.5) for _ in range(dim)] for _ in range(dim)]
A = [[random.gauss(0,.01) for _ in range(dim)] for _ in range(rank)]
B = [[random.gauss(0,.01) for _ in range(rank)] for _ in range(dim)]

def lora_fwd(x, scale=0.5):
    orig = mv(W, x)
    low  = mv(B, mv(A, x))
    return add_scaled(orig, low, scale)

x   = [1.0, 0.5, -1.0, 0.2]
out = lora_fwd(x)

print(f"Input:  {[round(v,3) for v in x]}")
print(f"Output: {[round(v,3) for v in out]}")
print(f"\nFull W params: {dim*dim}")
print(f"LoRA params:   {rank*dim*2}  ({rank*dim*2/(dim*dim)*100:.0f}% of W)")
print("At GPT-4 scale this becomes <1% of weights — runs on a single GPU.")
`,
      hint:"Run it. The math is simple; the insight is that you can represent meaningful changes to a huge matrix as the product of two tiny matrices." },
  ],
  e9: [
    { id:"e9e1", title:"Temperature sampling",
      prompt:"Show how temperature controls randomness in token sampling. Print probability distributions at temperatures 0.1, 0.5, 1.0, and 2.0.",
      starter:`import math

def softmax_t(logits, temp):
    s = [x/temp for x in logits]
    m = max(s); e=[math.exp(x-m) for x in s]; t=sum(e)
    return [x/t for x in e]

vocab   = ["the","a","this","that","one"]
logits  = [3.5, 2.0, 1.5, 0.8, 0.2]
temps   = [0.1, 0.5, 1.0, 2.0]

print(f"{'Token':<7}", end="")
for t in temps: print(f"  t={t}", end="")
print()
print("-"*46)
for i,tok in enumerate(vocab):
    print(f"{tok:<7}", end="")
    for t in temps:
        p=softmax_t(logits,t)[i]
        print(f"  {p:.3f}", end="")
    print()
print("\nLow temp → 'the' dominates (focused).  High temp → probabilities flatten (creative).")
`,
      hint:"Run it. At temp=0.1 the model almost always picks 'the'. At temp=2.0 any word is possible. This is exactly what the temperature slider in ChatGPT controls." },
  ],
  e10: [
    { id:"e10e1", title:"Forward diffusion (add noise)",
      prompt:"Simulate the forward diffusion process: add Gaussian noise to a pixel value across timesteps. Watch the signal disappear into pure noise.",
      starter:`import math, random; random.seed(42)

def add_noise(pixel, t, T=1000):
    beta = 0.0001 + (0.02-0.0001)*(t/T)
    noise= random.gauss(0,1)
    return math.sqrt(1-beta)*pixel + math.sqrt(beta)*noise, noise

pixel = 0.8   # bright pixel
print(f"Original: {pixel}")
print(f"\n{'Step':>5} {'Noisy':>8}")
print("-"*16)
noisy = pixel
for t in [1, 100, 300, 600, 999]:
    noisy, _ = add_noise(pixel, t)
    bar="█"*max(0, int((noisy+1)*10))
    print(f"{t:>5} {noisy:>8.3f}  {bar}")
print("\nAt t=999 the pixel is pure noise — the model learned to reverse this process.")
`,
      hint:"Run it multiple times (remove the seed or change it) to see noise randomness. The reverse process learns to undo ALL of these random noise additions in one shot." },
  ],
  e11: [
    { id:"e11e1", title:"Mini eval framework",
      prompt:"Build an eval that checks model responses for required keywords and appropriate length. Score each response and print a summary.",
      starter:`golden = [
    {"q":"What is machine learning?",
     "keywords":["data","patterns","learn"],
     "max_words":30,
     "response":"Machine learning is a type of AI that learns patterns from data through training examples."},
    {"q":"What is overfitting?",
     "keywords":["training","test","memorize"],
     "max_words":25,
     "response":"Overfitting happens when a model memorizes training data but fails to generalize to new test data."},
    {"q":"Explain gradient descent.",
     "keywords":["loss","minimum","gradient"],
     "max_words":20,
     "response":"You adjust weights by moving in the direction that reduces error."},
]

print(f"{'Question':<30} {'Keywords':>9} {'Length':>8} {'Score':>7}")
print("-"*58)
total=0
for e in golden:
    resp=e["response"].lower()
    kw_score = sum(1 for k in e["keywords"] if k in resp)/len(e["keywords"])
    len_ok   = len(resp.split()) <= e["max_words"]
    score    = (kw_score + int(len_ok))/2; total+=score
    print(f"{e['q'][:28]+'..':<30} {kw_score:>8.0%}  {'✓' if len_ok else '✗':>7}  {score:>6.0%}")
print(f"\nOverall: {total/len(golden):.0%}")
`,
      hint:"Run it. Real evals at companies are just this idea at thousands of (question, expected) pairs. LLM-as-judge replaces keyword checks with another model grading the response." },
  ],
};

/* ===================== QUIZZES ===================== */

const BEGINNER_QUIZ = [
  { q: "Which statement best describes machine learning?",
    options: ["Software that follows rules written entirely by programmers", "Software that learns patterns from data to make predictions", "A robot with human-level consciousness", "Any program that runs on the internet"],
    answer: 1, explain: "ML systems learn patterns from data rather than relying only on hand-written rules — that's what separates ML from traditional software." },
  { q: "Every AI system available today is best described as:",
    options: ["AGI — broadly capable like a human", "Narrow AI — excellent at specific tasks only", "Conscious but limited", "Rule-based with no learning"],
    answer: 1, explain: "Today's AI is narrow: superb at trained tasks, helpless outside them. AGI remains hypothetical." },
  { q: "A chatbot's core mechanic is:",
    options: ["Searching a database of answers", "Predicting the next word, repeatedly", "Following if/then rules written by engineers", "Copying text from websites live"],
    answer: 1, explain: "LLMs generate text one token at a time by predicting what comes next — astonishing abilities and hallucinations both stem from this." },
  { q: "A 'context window' refers to:",
    options: ["The chatbot's pop-up interface", "How much text the AI can consider at once", "The AI's training period", "A browser extension"],
    answer: 1, explain: "It's the model's working memory — how much of your conversation and documents it can hold in mind simultaneously." },
  { q: "You get an urgent call that sounds exactly like a family member asking for money. Best first response:",
    options: ["Send money fast — voices can't be faked", "Verify through another channel (call them back, use a family code word)", "Post about it on social media", "Give partial payment to be safe"],
    answer: 1, explain: "Voice cloning makes audio untrustworthy on its own. Verify identity through an independent channel before acting." },
  { q: "What distinguishes an AI 'agent' from a chatbot?",
    options: ["Agents are smaller models", "Agents take multi-step actions to complete tasks, not just answer", "Agents only work offline", "Agents can't make mistakes"],
    answer: 1, explain: "Agents browse, click, fill forms, and execute multi-step tasks — which is why they need human-in-the-loop safeguards." },
  { q: "Which prompt technique most reliably improves answers on tricky problems?",
    options: ["Typing in all caps", "Asking it to think step by step and showing examples of what you want", "Keeping prompts under five words", "Repeating the question three times"],
    answer: 1, explain: "Chain-of-thought ('think step by step') and few-shot examples are the two highest-impact prompting techniques." },
  { q: "AI text detectors should be treated as:",
    options: ["Definitive proof", "A weak hint at best — they produce false accusations and miss edited AI text", "Reliable for non-native English speakers", "Court-admissible evidence"],
    answer: 1, explain: "Detectors are unreliable and notoriously flag non-native writers' human text. Judge claims by evidence and sources instead." },
];

const INTERMEDIATE_QUIZ = [
  { q: "Predicting whether a tumor is benign or malignant is an example of:",
    options: ["Regression", "Classification", "Clustering", "Reinforcement learning"],
    answer: 1, explain: "It predicts a category, which makes it classification. Predicting a number would be regression." },
  { q: "A model scores 99% on training data but 60% on test data. This is most likely:",
    options: ["Underfitting", "Overfitting", "Perfect performance", "A data loading bug"],
    answer: 1, explain: "A large train/test gap is the classic signature of overfitting — memorization instead of learning." },
  { q: "You fit a StandardScaler on ALL your data before splitting train/test. This causes:",
    options: ["Faster training", "Data leakage — test info contaminates training", "Better generalization", "Nothing; it's recommended"],
    answer: 1, explain: "Test-set statistics leak into preprocessing. Fit the scaler on training data only, then transform the test set." },
  { q: "Only 1% of transactions are fraud. A model that flags nothing is 99% accurate. The metric to examine is:",
    options: ["Accuracy alone", "Recall (and precision)", "Training speed", "Dataset size"],
    answer: 1, explain: "Recall reveals how many fraud cases you actually caught — accuracy hides total failure on the rare class." },
  { q: "Which model is the strongest 'default' for tabular data with minimal tuning?",
    options: ["KNN", "Random forest", "A single deep decision tree", "Linear regression always"],
    answer: 1, explain: "Random forests are accurate, robust to scaling, and hard to badly misconfigure — the standard serious baseline." },
  { q: "Cross-validation reports 85% ± 15%. The right interpretation is:",
    options: ["The model reliably scores 85%", "Performance is highly unstable — the mean alone can't be trusted", "Add the numbers: it's 100% accurate", "The test set is too large"],
    answer: 1, explain: "Huge variance across folds means single-split results are luck. Report and act on the spread, not just the mean." },
  { q: "K-means with unscaled features (income: 0–500,000; age: 0–100) will:",
    options: ["Work perfectly", "Be dominated by income because its numeric range is huge", "Ignore income", "Crash"],
    answer: 1, explain: "K-means uses distances, and the feature with the biggest range dominates them. Scale before clustering." },
  { q: "Tuning hyperparameters until the TEST score peaks is wrong because:",
    options: ["It takes too long", "You've silently fit the test set, inflating the reported score", "GridSearchCV forbids it", "Test sets are only for regression"],
    answer: 1, explain: "Tune inside cross-validation on training data; touch the final test set exactly once for the honest number." },
  { q: "A deployed model's accuracy quietly degrades over months. The likely cause is:",
    options: ["The model file corrupting", "Data drift — the world shifting away from the training data", "Too much RAM", "joblib expiring"],
    answer: 1, explain: "Patterns change — behaviors, prices, seasons. Monitoring for drift and scheduled retraining are core MLOps." },
];

const EXPERT_QUIZ = [
  { q: "What is the purpose of an activation function like ReLU?",
    options: ["Speeding up data loading", "Adding non-linearity so layers don't collapse into one linear function", "Saving the model to disk", "Normalizing input images"],
    answer: 1, explain: "Without non-linear activations, any stack of layers is mathematically one linear layer — non-linearity gives depth its power." },
  { q: "Training loss suddenly explodes to NaN. The most likely culprit:",
    options: ["Too much dropout", "Learning rate set too high", "Too many epochs", "The test set is too small"],
    answer: 1, explain: "Oversized steps bounce out of loss valleys and diverge. Reduce the learning rate (and consider warmup)." },
  { q: "Compared to Dense layers on images, Conv2D layers chiefly provide:",
    options: ["More parameters", "Translation invariance and massive parameter sharing", "Faster disk loading", "Automatic labeling"],
    answer: 1, explain: "Small filters reused across the whole image detect patterns anywhere with a tiny fraction of the weights." },
  { q: "RNNs lost to transformers primarily because RNNs:",
    options: ["Cannot output text", "Process sequentially, blocking GPU parallelism, and forget long-range context", "Are too large", "Need labeled data"],
    answer: 1, explain: "Sequential processing can't exploit parallel hardware, and long-range information fades. Attention fixed both." },
  { q: "In self-attention, a token's Query vector is matched against other tokens':",
    options: ["Values", "Keys", "Embeddings only", "Gradients"],
    answer: 1, explain: "Query·Key dot products produce attention scores, which then weight the Values that get blended together." },
  { q: "'How do I reset my password?' matching 'Steps to recover account access' with zero shared words is powered by:",
    options: ["Keyword search", "Embedding similarity (semantic search)", "Regular expressions", "A rules engine"],
    answer: 1, explain: "Both texts map to nearby vectors in embedding space — the foundation of semantic search and RAG retrieval." },
  { q: "RLHF refers to:",
    options: ["A GPU memory format", "Optimizing a model against human preference rankings via a reward model", "Random Layer Height Functions", "A data augmentation method"],
    answer: 1, explain: "Humans rank outputs, a reward model learns the preferences, and the LLM is tuned against it — the taming stage after pretraining." },
  { q: "Diffusion models generate images by:",
    options: ["Pasting fragments of training images", "Iteratively denoising random noise, guided by the prompt", "A forger-vs-detective game", "Searching the web"],
    answer: 1, explain: "They learn to reverse noising; generation denoises static into an image over ~20–50 steps. (Forger-vs-detective describes GANs.)" },
  { q: "You have 2,000 labeled images. The most effective modern approach:",
    options: ["Train a huge CNN from scratch", "Transfer learning from a pre-trained model, then careful fine-tuning", "Use a spreadsheet", "Duplicate every image 100 times"],
    answer: 1, explain: "Pre-trained features from millions of images make small datasets viable; from-scratch training would badly overfit." },
  { q: "The most reliable way to know an LLM product actually works is:",
    options: ["The demo felt impressive", "Systematic evals: golden datasets, benchmarks, LLM-as-judge, A/B tests", "High temperature settings", "A bigger context window"],
    answer: 1, explain: "Vibes don't scale. Teams shipping reliable AI are defined by their eval discipline." },
];

/* ===================== CHALLENGES ===================== */

const BEGINNER_CHALLENGES = [
  { id: "bc1", title: "Your very first program", runnable: true,
    prompt: "Every coder starts here. Use print() to display the message: Hello, AI world! Then on a second line, print your name.",
    starter: `# Type your code below, then press Run
print("Hello, AI world!")
`,
    hint: "print() displays whatever you put inside the quotes. Add a second print() line with your name." },
  { id: "bc2", title: "Variables: a computer's memory", runnable: true,
    prompt: "Create a variable called tool with the value \"ChatGPT\", and a variable called category with the value \"LLM\". Print a sentence using both, like: ChatGPT is an LLM.",
    starter: `tool = "ChatGPT"
category = "LLM"
# Now print a sentence combining them.
# Tip: print(tool + " is an " + category)
`,
    hint: "Use + to glue strings together inside print(), or an f-string: print(f\"{tool} is an {category}\")" },
  { id: "bc3", title: "Make a decision (if/else)", runnable: true,
    prompt: "AI is full of decisions. Set confidence = 0.85. If confidence is greater than 0.7, print \"Prediction accepted\". Otherwise print \"Needs human review\". Then change the number and re-run!",
    starter: `confidence = 0.85

# Write an if/else below
`,
    hint: "if confidence > 0.7:  (then an indented print). else:  (another indented print). Indentation matters in Python!" },
  { id: "bc4", title: "Token counter", runnable: true,
    prompt: "Chatbots measure text in tokens (~3/4 of a word). Given the sentence below, count its words with .split(), estimate tokens as words divided by 0.75, and print both numbers.",
    starter: `sentence = "AI literacy is becoming as important as reading"

words = sentence.split()
# print the word count, then the token estimate
`,
    hint: "len(words) gives the count. Tokens ≈ len(words) / 0.75. Try round() to tidy the result." },
];

const INTERMEDIATE_CHALLENGES = [
  { id: "ic1", title: "Compute accuracy by hand", runnable: true,
    prompt: "Before trusting library functions, compute accuracy yourself. Given the true labels and predictions below, count how many match and print the accuracy as a fraction (e.g. 0.8).",
    starter: `y_true = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1]
y_pred = [1, 0, 0, 1, 0, 1, 1, 0, 1, 0]

correct = 0
# Count matches with a loop (or zip), then divide by len(y_true)
`,
    hint: "for t, p in zip(y_true, y_pred): if t == p: correct += 1. Then print(correct / len(y_true))." },
  { id: "ic2", title: "Median imputation by hand", runnable: true,
    prompt: "Real data has holes. The incomes list uses None for missing values. Compute the median of the present values (sort them; middle element), replace every None with it, and print the repaired list.",
    starter: `incomes = [48000, None, 52000, 61000, None, 45000, 58000]

present = [x for x in incomes if x is not None]
# sort present, find the median, then rebuild the list
`,
    hint: "present.sort(); median = present[len(present)//2]. Rebuild: [x if x is not None else median for x in incomes]." },
  { id: "ic3", title: "Precision & recall from a confusion matrix", runnable: true,
    prompt: "A spam filter produced: 40 true positives, 10 false positives, 5 false negatives, 45 true negatives. Compute and print precision (TP/(TP+FP)) and recall (TP/(TP+FN)).",
    starter: `tp, fp, fn, tn = 40, 10, 5, 45

# precision = of everything flagged spam, how much really was?
# recall    = of all real spam, how much did we catch?
`,
    hint: "precision = tp / (tp + fp) → 0.8. recall = tp / (tp + fn) → 0.888…" },
  { id: "ic4", title: "Standardize features by hand", runnable: true,
    prompt: "Implement standardization: for the ages below, compute the mean and standard deviation (use the formulas, no libraries), then print each value as (x - mean) / std. The results should hover around -2 to 2.",
    starter: `ages = [22, 35, 41, 29, 55, 33, 47]

mean = sum(ages) / len(ages)
# variance = average of squared differences from the mean
# std = variance ** 0.5
`,
    hint: "var = sum((x-mean)**2 for x in ages)/len(ages); std = var**0.5; print([(x-mean)/std for x in ages])." },
  { id: "ic5", title: "Write a real scikit-learn pipeline", runnable: false,
    prompt: "Write a complete scikit-learn script: load Iris, split 75/25, train a RandomForestClassifier with 200 trees, print test accuracy AND the top feature importances. (ML libraries can't run in-browser — press 'AI Feedback' for a line-by-line review.)",
    starter: `from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Your pipeline here:
`,
    hint: "Follow the pattern: load → split (test_size=0.25) → RandomForestClassifier(n_estimators=200) → fit → predict → accuracy_score → model.feature_importances_." },
];

const EXPERT_CHALLENGES = [
  { id: "ec1", title: "Implement ReLU from scratch", runnable: true,
    prompt: "Write a function relu(x) that returns x if x > 0, otherwise 0. Apply it to every value in the list and print the result. You should get [0, 0, 1.5, 3, 0].",
    starter: `values = [-2, -0.5, 1.5, 3, 0]

def relu(x):
    # your code here
    pass

# Apply relu to each value and print the resulting list
`,
    hint: "return max(0, x) is the one-liner. Then [relu(v) for v in values]." },
  { id: "ec2", title: "Forward pass of a single neuron", runnable: true,
    prompt: "Compute one neuron's output: multiply each input by its weight, sum, add the bias, apply ReLU. Print the final output (expected: 1.35).",
    starter: `inputs  = [0.5, -1.0, 2.0]
weights = [0.4,  0.6, 0.8]
bias    = 0.15

# weighted sum, + bias, then ReLU
`,
    hint: "z = sum(i*w for i, w in zip(inputs, weights)) + bias → 1.35. ReLU keeps it positive." },
  { id: "ec3", title: "Softmax by hand", runnable: true,
    prompt: "Implement softmax: exponentiate each logit (math.exp), divide each by the sum of all exponentials, print the probabilities, and verify they sum to 1.0.",
    starter: `import math

logits = [2.0, 1.0, 0.1]

# exps = [...]; probs = [...]
`,
    hint: "exps = [math.exp(x) for x in logits]; total = sum(exps); probs = [e/total for e in exps]." },
  { id: "ec4", title: "One step of gradient descent", runnable: true,
    prompt: "Minimize loss = (w - 3)² by hand. Starting at w = 0 with learning rate 0.1, the gradient is 2*(w - 3). Run 20 update steps (w -= lr * gradient), printing w every 5 steps. Watch it converge toward 3.",
    starter: `w = 0.0
lr = 0.1

for step in range(1, 21):
    grad = 2 * (w - 3)
    # update w, and print at steps 5, 10, 15, 20
`,
    hint: "w -= lr * grad. Use 'if step % 5 == 0: print(step, w)'. After 20 steps w ≈ 2.96." },
  { id: "ec5", title: "Cosine similarity of embeddings", runnable: true,
    prompt: "Two sentences became these mini-embeddings. Compute cosine similarity: dot product divided by the product of magnitudes (magnitude = sqrt of sum of squares). Print the score — above 0.9 means very similar meaning.",
    starter: `import math

a = [0.2, 0.8, 0.1, 0.5]
b = [0.25, 0.7, 0.15, 0.55]

# dot = sum of pairwise products
# mag = math.sqrt(sum of squares) for each vector
`,
    hint: "dot = sum(x*y for x,y in zip(a,b)); mag_a = math.sqrt(sum(x*x for x in a)); similarity = dot/(mag_a*mag_b)." },
  { id: "ec6", title: "Design a Keras CNN", runnable: false,
    prompt: "Write a complete Keras script for CIFAR-10 (32×32 color images, 10 classes): at least two Conv2D + MaxPooling2D blocks, data augmentation layers, dropout, a proper output layer, compiled with a suitable loss, and an EarlyStopping callback. (Press 'AI Feedback' for an expert architecture review.)",
    starter: `import tensorflow as tf
from tensorflow import keras

# input_shape will be (32, 32, 3)
model = keras.Sequential([
    # augmentation, conv blocks, head...
])

# compile + callbacks
`,
    hint: "RandomFlip/RandomRotation first, Conv2D(32)→Pool→Conv2D(64)→Pool, Dropout(0.3), Dense(10, softmax), sparse_categorical_crossentropy, EarlyStopping(patience=3)." },
];

/* ===================== TRACKS ===================== */

const TRACKS = [
  { id: "beginner", label: "Beginner", tagline: "No tech background needed", color: C.teal,
    description: "Understand what AI actually is, master the tools people use every day, and build the judgment to use them safely — from prompting to spotting deepfakes to AI agents.",
    lessons: BEGINNER_LESSONS, quiz: BEGINNER_QUIZ, challenges: BEGINNER_CHALLENGES },
  { id: "intermediate", label: "Intermediate", tagline: "Start building with Python", color: C.blue,
    description: "A real ML curriculum: data cleaning, feature engineering, the algorithm zoo, honest evaluation with cross-validation, and shipping models to production with scikit-learn.",
    lessons: INTERMEDIATE_LESSONS, quiz: INTERMEDIATE_QUIZ, challenges: INTERMEDIATE_CHALLENGES },
  { id: "expert", label: "Expert", tagline: "Deep learning & the frontier", color: C.purple,
    description: "Neural networks from the math up: optimizers, CNNs, transformers and attention, embeddings & RAG, how LLMs are made (RLHF), diffusion models, and production MLOps.",
    lessons: EXPERT_LESSONS, quiz: EXPERT_QUIZ, challenges: EXPERT_CHALLENGES },
];

/* ===================== AI ENCYCLOPEDIA ===================== */

const ENCYCLOPEDIA = [
  { name: "ChatGPT", level: "beginner", category: "Chatbot / LLM",
    what: "An AI chatbot made by OpenAI. It's a Large Language Model — software trained on huge amounts of text so it can hold conversations.",
    does: "Answers questions, writes and edits text (emails, essays, resumes), explains concepts, brainstorms ideas, summarizes documents, and helps with homework or planning.",
    example: "Paste in a confusing email from your insurance company and ask: 'Explain this in plain English and tell me what I need to do.'" },
  { name: "Claude", level: "beginner", category: "Chatbot / LLM",
    what: "An AI assistant made by Anthropic, similar in spirit to ChatGPT. Known for handling long documents and careful, detailed answers.",
    does: "Conversation, writing, analysis, coding help, and working through long files — you can give it an entire report or book chapter and ask questions about it.",
    example: "Upload a 40-page PDF contract and ask: 'List anything in here that could cost me money.'" },
  { name: "Gemini", level: "beginner", category: "Chatbot / LLM",
    what: "Google's AI assistant. It's woven into Google products like Gmail, Docs, and Android phones.",
    does: "Everything other chatbots do, plus tight Google integration: drafting replies in Gmail, summarizing Docs, and answering with Search results.",
    example: "In Gmail, click the Gemini button and say: 'Draft a polite reply declining this meeting.'" },
  { name: "Midjourney / DALL·E", level: "beginner", category: "Image generation",
    what: "AI tools that create images from text descriptions. Midjourney is its own service; DALL·E is OpenAI's image tool built into ChatGPT.",
    does: "Turns a written description into original images in seconds. Used for art drafts, marketing graphics, and visual brainstorming.",
    example: "Type 'flat illustration of students building a robot, bright colors, poster style' to get event artwork drafts instantly." },
  { name: "Perplexity", level: "beginner", category: "AI search",
    what: "An AI-powered search engine. Instead of ten blue links, it reads the web and writes a direct answer — with citations.",
    does: "Answers research questions with sources you can verify. A middle ground between Google (you read) and a chatbot (which might hallucinate).",
    example: "Ask 'What are the current FDA rules on AI in medical devices?' and get a cited summary." },
  { name: "GitHub Copilot", level: "beginner", category: "Coding assistant",
    what: "An AI assistant for programmers, made by GitHub and Microsoft. It lives inside the code editor.",
    does: "Suggests code as you type — autocomplete for entire functions. Explains confusing code, fixes bugs, writes repetitive code.",
    example: "A developer types '# function to validate email addresses' and Copilot writes the whole function." },
  { name: "AI agents", level: "beginner", category: "Emerging tools",
    what: "AI that completes multi-step tasks rather than just answering — browsing, clicking, filling forms, writing code across files.",
    does: "Deep-research modes compile cited reports from dozens of sources; computer-use agents operate a browser; coding agents build features autonomously.",
    example: "'Research the top 5 CRM tools for nonprofits and make me a comparison table' — and it browses, reads, and reports back." },
  { name: "NotebookLM", level: "beginner", category: "Study tool",
    what: "A Google tool that becomes an expert in YOUR documents. You upload files; it answers based only on them.",
    does: "Turns notes, textbooks, or PDFs into summaries, study guides, FAQs, and an AI-generated podcast discussing your material.",
    example: "Upload all your lecture slides before an exam and ask it to quiz you chapter by chapter." },
  { name: "Voice & music AI", level: "beginner", category: "Creative AI",
    what: "Tools like ElevenLabs (voice) and Suno (music) that generate or clone audio from text.",
    does: "Creates realistic narration, dubs videos into other languages in the original speaker's voice, composes complete songs from a description.",
    example: "Give ElevenLabs a paragraph and get audiobook-quality narration in any voice or language." },

  { name: "Python", level: "intermediate", category: "Programming language",
    what: "The programming language of AI and data science. Designed to read almost like English — the standard first language.",
    does: "Analyzing data, training models, automating tasks, building apps. Nearly every ML library targets Python first.",
    example: "Three lines of Python can load a 100,000-row spreadsheet and report any column's statistics." },
  { name: "NumPy", level: "intermediate", category: "Python library",
    what: "Python's foundation for fast math — 'Numerical Python'. Almost every ML library is built on top of it.",
    does: "Math on millions of values at once via arrays. Images, datasets, and model weights are all arrays underneath.",
    example: "np.mean(temperatures) averages a million readings instantly." },
  { name: "pandas", level: "intermediate", category: "Python library",
    what: "Python's spreadsheet superpower — the DataFrame, a table of rows and columns you control with code.",
    does: "Loads CSVs, cleans messy data, filters, groups, merges. Where 80% of real ML work (data preparation) happens.",
    example: "df.groupby('city')['income'].mean() — average income per city, one line." },
  { name: "scikit-learn", level: "intermediate", category: "ML library",
    what: "The standard Python library for classic machine learning ('sklearn').",
    does: "Ready-made algorithms — forests, regression, clustering — plus splitting, scaling, and metrics, all behind one fit/predict pattern.",
    example: "A house-price model in ~6 lines: load, split, create, fit, predict, score." },
  { name: "Matplotlib / seaborn", level: "intermediate", category: "Python library",
    what: "Python's chart-drawing libraries — matplotlib is the engine, seaborn the stylish shortcut layer.",
    does: "Line charts, scatter plots, histograms, heatmaps — essential for exploring data before modeling and presenting after.",
    example: "plt.scatter(sqft, price) instantly reveals whether bigger houses cost more in your data." },
  { name: "Jupyter / Google Colab", level: "intermediate", category: "Coding environment",
    what: "Interactive coding notebooks where code, output, charts, and notes live together. Colab hosts them free in your browser with GPUs.",
    does: "Run code in small cells and see results immediately — the data scientist's default workspace, zero installation in Colab's case.",
    example: "Open colab.research.google.com, paste this app's Iris code, press Run — it just works." },
  { name: "API", level: "intermediate", category: "Concept",
    what: "Application Programming Interface — a doorway letting your code use someone else's software. AI companies sell model access through APIs.",
    does: "Your app sends a request ('summarize this'); their servers run the model and return the answer. How apps add AI without building models.",
    example: "This very app calls the Claude and ChatGPT APIs for your quizzes and code feedback." },
  { name: "Kaggle", level: "intermediate", category: "Community / data",
    what: "The home of data science competitions and free datasets, owned by Google.",
    does: "Thousands of practice datasets, ML competitions, free courses, and shared notebooks from top practitioners.",
    example: "Download the Titanic dataset and compete to predict who survived — the classic first project." },
  { name: "XGBoost / LightGBM", level: "intermediate", category: "ML library",
    what: "Gradient-boosting libraries — trees built sequentially, each correcting the last's errors.",
    does: "Deliver the strongest accuracy on most tabular problems; the perennial winners of data science competitions.",
    example: "Swap RandomForestClassifier for XGBClassifier and often gain a few points of accuracy on the same data." },

  { name: "TensorFlow", level: "expert", category: "Deep learning framework",
    what: "Google's deep learning framework — industrial-strength software for building and training neural networks at any scale.",
    does: "Runs deep learning math on GPUs/TPUs from laptop to data center, with strong deployment to servers, phones, and browsers.",
    example: "Gmail's Smart Reply and Google Photos search were built on TensorFlow." },
  { name: "Keras", level: "expert", category: "Deep learning API",
    what: "The friendly face of deep learning — networks as simple stacks of layers. Ships inside TensorFlow; now runs on PyTorch and JAX too.",
    does: "Turns hundreds of lines of raw math into ~10 readable ones: Sequential to define, compile to configure, fit to train.",
    example: "This app's MNIST classifier is 15 lines of Keras and hits ~98% accuracy." },
  { name: "PyTorch", level: "expert", category: "Deep learning framework",
    what: "Meta's deep learning framework and TensorFlow's main rival — the favorite of AI researchers.",
    does: "Same job as TensorFlow with a more flexible, 'pythonic' feel; most new research papers ship PyTorch code.",
    example: "Many frontier AI systems and Tesla's vision models were trained with PyTorch." },
  { name: "Hugging Face", level: "expert", category: "Model hub",
    what: "The 'GitHub of AI models' — hundreds of thousands of pre-trained models and datasets, plus the transformers library.",
    does: "Download state-of-the-art models and use or fine-tune them in a few lines instead of training from scratch.",
    example: "pipeline('sentiment-analysis')('I love this!') — production-quality sentiment in one line." },
  { name: "Transformer & attention", level: "expert", category: "Architecture",
    what: "The architecture behind GPT, Claude, and Gemini. Self-attention lets every token weigh its relevance to every other token.",
    does: "Captures long-range meaning in parallel (GPU-friendly), enabling internet-scale training that RNNs never could.",
    example: "In 'it was tired', attention is how the model knows 'it' means the animal, not the road." },
  { name: "Embeddings & vector DBs", level: "expert", category: "Technique",
    what: "Embeddings turn text/images into meaning-vectors; vector databases (Pinecone, Chroma, pgvector) search them by similarity.",
    does: "Powers semantic search, recommendations, and RAG — retrieving your documents to ground an LLM's answers.",
    example: "'Reset my password' matches 'recover account access' with zero shared words." },
  { name: "RLHF & alignment", level: "expert", category: "Training technique",
    what: "Reinforcement Learning from Human Feedback — tuning a model against human preference rankings via a learned reward model.",
    does: "Transforms a raw next-word predictor into a helpful, safer assistant. The stage that made ChatGPT feel different from GPT-3.",
    example: "Humans rank answer A over B thousands of times; the model learns to produce more A-like answers." },
  { name: "Diffusion models", level: "expert", category: "Generative AI",
    what: "The technology behind DALL·E, Midjourney, and Stable Diffusion — networks trained to reverse noise, step by step.",
    does: "Generates images (and video, à la Sora) by iteratively denoising random static, guided by your prompt's embedding.",
    example: "20–50 denoising steps turn pure noise into 'a watercolor lighthouse at sunset'." },
  { name: "LoRA fine-tuning", level: "expert", category: "Technique",
    what: "Low-Rank Adaptation — fine-tuning a huge model by training small added matrices instead of all its weights.",
    does: "Customizes LLMs and image models on a single GPU at <1% of full fine-tuning cost; adapters are tiny shareable files.",
    example: "Teach Stable Diffusion your art style with 30 images and a LoRA — on a gaming PC." },
  { name: "MLOps & evals", level: "expert", category: "Production",
    what: "The discipline of running ML reliably: experiment tracking, model registries, serving, monitoring — plus systematic evaluation of AI outputs.",
    does: "Catches drift before users do; evals (golden datasets, LLM-as-judge, A/B tests) prove an AI product actually works.",
    example: "Weights & Biases logs every training run; a nightly eval suite blocks any model that regresses." },
];

/* ===================== UI HELPERS ===================== */

const fontCSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; }
body { margin: 0; }
button { font-family: inherit; cursor: pointer; }
button:disabled { cursor: default; opacity: .6; }
textarea:focus, input:focus { outline: 2px solid #0F6B66; }
@keyframes fadeUp { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} }
.fadeUp { animation: fadeUp .35s ease both; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
.pulse { animation: pulse 1.2s ease infinite; }
`;

const Display = { fontFamily: "'Space Grotesk', sans-serif" };
const Body = { fontFamily: "'Inter', sans-serif" };
const Mono = { fontFamily: "'JetBrains Mono', monospace" };

const backBtn = { background: "none", border: "none", color: C.inkSoft, fontSize: 14, padding: 0, fontFamily: "'Inter', sans-serif" };
const primaryBtn = (color) => ({ ...Display, background: color, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 600 });
const outlineBtn = (color) => ({ ...Display, background: "transparent", color, border: `2px solid ${color}`, borderRadius: 10, padding: "10px 22px", fontSize: 15, fontWeight: 600 });
const smallBtn = (color, filled) => ({ ...Display, background: filled ? color : "transparent", color: filled ? "#fff" : color, border: `2px solid ${color}`, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600 });

function ProgressBar({ done, total, color }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: C.line, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 4, transition: "width .4s" }} />
      </div>
      <span style={{ ...Mono, fontSize: 11, color: C.inkSoft, minWidth: 64 }}>{done}/{total} · {pct}%</span>
    </div>
  );
}

function CodeBlock({ code }) {
  return (
    <pre style={{ ...Mono, background: C.codeBg, color: C.codeText, borderRadius: 10, padding: "16px 18px", fontSize: 13, lineHeight: 1.65, overflowX: "auto", margin: "12px 0 0" }}>
      {code}
    </pre>
  );
}


/* ===================== INLINE CODING EXERCISE ===================== */

function InlineCodingExercise({ exercise, color }) {
  const [code, setCode] = useState(exercise.starter);
  const [output, setOutput] = useState(null); // { ok: bool, text: string } | null
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [pyReady, setPyReady] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    loadPy().then(() => setPyReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  async function run() {
    if (running) return;
    setRunning(true);
    setOutput(null);
    try {
      const py = await loadPy();
      let buf = "";
      py.setStdout({ batched: (s) => { buf += s + "\n"; } });
      py.setStderr({ batched: (s) => { buf += s + "\n"; } });
      try {
        await py.runPythonAsync(code);
        setOutput({ ok: true, text: buf.trim() || "(program ran — no output. Add a print() to see results!)" });
      } catch (err) {
        const msg = String(err.message || err);
        if (msg.includes("SystemExit")) {
          setOutput({ ok: true, text: buf.trim() || "(program exited)" });
        } else {
          const tail = msg.split("\n").filter((l) => l.trim()).slice(-3).join("\n");
          setOutput({ ok: false, text: (buf ? buf + "\n" : "") + tail });
        }
      }
    } catch {
      setOutput({ ok: false, text: "Python runtime couldn't load. Try Ask AI for help instead." });
    } finally {
      setRunning(false);
    }
  }

  async function sendChat(userText) {
    const msg = userText ?? chatInput.trim();
    if (!msg || chatLoading) return;
    const history = [...chatMessages, { role: "user", text: msg }];
    setChatMessages(history);
    setChatInput("");
    setChatLoading(true);
    try {
      const context = chatMessages.length === 0
        ? `The learner is working on this Python exercise: "${exercise.prompt}"\n\nTheir current code:\n${code}\n\n${output ? `When run it produced:\n${output.text}` : "Not run yet."}\n\nLearner: ${msg}`
        : history.map((m) => `${m.role === "user" ? "Learner" : "Tutor"}: ${m.text}`).join("\n") + "\nTutor:";
      const reply = await callAI({
        system: "You are a friendly Python coding tutor helping a learner in an AI literacy course. Be encouraging, specific, and concise. 2-4 sentences. Plain text only — no markdown.",
        prompt: context,
        maxTokens: 400,
      });
      setChatMessages([...history, { role: "ai", text: reply.trim() }]);
    } catch (e) {
      const errText = e.message === "RATE_LIMIT"
        ? "You've hit today's AI limit — try again tomorrow."
        : e.message === "NO_KEY"
        ? "AI requires an OpenAI key — contact the site admin."
        : "Couldn't reach AI right now — try again.";
      setChatMessages([...history, { role: "ai", text: errText }]);
    } finally {
      setChatLoading(false);
    }
  }

  function openChat() {
    setChatOpen(true);
    if (chatMessages.length === 0) {
      sendChat("I need help with this exercise. Can you look at my code and guide me?");
    }
  }

  return (
    <div style={{ background: "#0C1A1D", borderRadius: 12, padding: "18px 20px", marginTop: 14, border: `1px solid rgba(255,255,255,.09)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ ...Mono, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", background: color, color: "#fff", borderRadius: 4, padding: "3px 8px" }}>Try it</span>
        <span style={{ ...Body, fontSize: 13.5, color: "#C8DCD9", lineHeight: 1.5 }}>{exercise.prompt}</span>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={Math.max(6, code.split("\n").length + 1)}
        style={{ ...Mono, width: "100%", fontSize: 12.5, background: "#060E10", color: "#D7E8E5", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "13px 15px", minHeight: 110, resize: "vertical", lineHeight: 1.65, boxSizing: "border-box" }}
      />
      <div style={{ textAlign: "right", marginTop: 2, marginBottom: 2 }}>
        <span style={{ ...Mono, fontSize: 10, color: "#3A5F5C" }}>↕ drag bottom-right corner to resize</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <button onClick={run} disabled={running}
          style={{ ...Display, background: color, color: "#fff", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: running ? "default" : "pointer", opacity: running ? .7 : 1 }}>
          {running ? "Running…" : "▶ Run"}
        </button>
        <button onClick={() => setShowHint((h) => !h)}
          style={{ ...Display, background: "transparent", color: "#7AADA9", border: "1px solid rgba(255,255,255,.12)", borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}>
          {showHint ? "Hide hint" : "Hint"}
        </button>
        <button onClick={() => { setCode(exercise.starter); setOutput(null); setChatMessages([]); setChatOpen(false); }}
          style={{ ...Display, background: "transparent", color: "#7AADA9", border: "1px solid rgba(255,255,255,.12)", borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}>
          Reset
        </button>
        <button onClick={chatOpen ? () => setChatOpen(false) : openChat}
          style={{ ...Display, background: chatOpen ? "#0E2229" : "#1A3340", color: "#7EDCD4", border: "1px solid rgba(126,220,212,.3)", borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600, marginLeft: "auto" }}>
          {chatOpen ? "Close AI chat" : "✦ Ask AI"}
        </button>
      </div>

      {showHint && (
        <p style={{ ...Body, fontSize: 13, color: "#8BBFBB", margin: "12px 0 0", lineHeight: 1.65, borderLeft: `3px solid ${color}`, paddingLeft: 12 }}>
          {exercise.hint}
        </p>
      )}

      {output != null && (
        <pre style={{ ...Mono, background: "#000", color: output.ok ? "#7EF5A0" : "#FF7B7B", borderRadius: 8, padding: "12px 15px", fontSize: 12.5, margin: "12px 0 0", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {output.text}
        </pre>
      )}

      {!pyReady && (
        <p className="pulse" style={{ ...Mono, fontSize: 11, color: "#5A8885", margin: "8px 0 0" }}>Loading Python runtime…</p>
      )}

      {chatOpen && (
        <div className="fadeUp" style={{ marginTop: 14, background: "#071217", border: "1px solid rgba(126,220,212,.18)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...Mono, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: "#7EDCD4" }}>AI Tutor</span>
            <span style={{ ...Body, fontSize: 12, color: "#3A6A66" }}>— ask anything about this exercise</span>
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "9px 13px", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: m.role === "user" ? color : "#0E2229",
                  border: m.role === "ai" ? "1px solid rgba(126,220,212,.15)" : "none",
                  fontSize: 13.5, color: m.role === "user" ? "#fff" : "#C8DCD9", lineHeight: 1.65,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: "flex-start" }}>
                <div className="pulse" style={{ ...Mono, fontSize: 12, color: "#3A6A66", padding: "8px 12px", background: "#0E2229", borderRadius: "12px 12px 12px 2px", border: "1px solid rgba(126,220,212,.1)" }}>
                  AI is thinking…
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", gap: 8 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
              placeholder="Ask a follow-up question…"
              disabled={chatLoading}
              style={{ ...Body, flex: 1, background: "#0C1A1D", color: "#D7E8E5", border: "1px solid rgba(255,255,255,.1)", borderRadius: 7, padding: "9px 13px", fontSize: 13.5, outline: "none" }}
            />
            <button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()}
              style={{ ...Display, background: color, color: "#fff", border: "none", borderRadius: 7, padding: "9px 16px", fontSize: 13, fontWeight: 600, opacity: (chatLoading || !chatInput.trim()) ? .5 : 1 }}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== AI CHAT WIDGET ===================== */

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const history = next.map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`).join("\n");
      const reply = await callAI({
        system: "You are a friendly AI literacy tutor. Answer clearly and concisely — 2 to 4 sentences unless more detail is truly needed. Plain text only, no markdown.",
        prompt: `Conversation so far:\n${history}\nTutor:`,
        maxTokens: 400,
      });
      setMessages([...next, { role: "ai", text: reply.trim() }]);
    } catch {
      setMessages([...next, { role: "ai", text: "Sorry, I couldn't connect to OpenAI. Check that VITE_OPENAI_KEY is set in your .env file." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div style={{ position: "fixed", bottom: 84, right: 24, width: 340, maxHeight: 480, background: C.card, borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,.18)", display: "flex", flexDirection: "column", zIndex: 1000, border: `1px solid ${C.line}` }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...Display, fontWeight: 700, fontSize: 15, flex: 1 }}>Ask the AI tutor</span>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} style={{ ...backBtn, fontSize: 12 }}>Clear</button>
            )}
            <button onClick={() => setOpen(false)} style={{ ...backBtn, fontSize: 20, lineHeight: 1, paddingLeft: 6 }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
            {messages.length === 0 && (
              <p style={{ color: C.inkSoft, fontSize: 13, margin: 0, lineHeight: 1.65 }}>
                Ask me anything about AI, machine learning, or what you're studying in the curriculum.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                <div style={{
                  background: m.role === "user" ? C.teal : C.tealSoft,
                  color: m.role === "user" ? "#fff" : C.ink,
                  borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "9px 13px", fontSize: 13.5, lineHeight: 1.55,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start" }}>
                <div className="pulse" style={{ background: C.tealSoft, borderRadius: "14px 14px 14px 4px", padding: "9px 13px", fontSize: 13, color: C.inkSoft }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything about AI…"
              style={{ ...Body, flex: 1, padding: "9px 12px", border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 13 }}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{ ...primaryBtn(C.teal), padding: "9px 16px", fontSize: 13 }}>
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        title="Chat with AI tutor"
        style={{ position: "fixed", bottom: 24, right: 24, width: 52, height: 52, borderRadius: "50%", background: open ? C.ink : C.teal, border: "none", boxShadow: "0 4px 16px rgba(15,107,102,.35)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}
      >
        {open
          ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2l14 14M16 2L2 16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/></svg>
          : <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-5 4V4z" fill="#fff"/></svg>
        }
      </button>
    </>
  );
}

/* ===================== MAIN APP ===================== */

function loadSaved(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export default function App({ session, onSignIn, onSignOut }) {
  const [view, setView] = useState({ screen: "home" });
  const [completed, setCompleted] = useState(() => loadSaved("ail_completed", {}));
  const [quizBest, setQuizBest] = useState(() => loadSaved("ail_quizBest", {}));
  const [solvedChallenges, setSolvedChallenges] = useState(() => loadSaved("ail_solved", {}));

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = fontCSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  useEffect(() => { try { localStorage.setItem("ail_completed", JSON.stringify(completed)); } catch {} }, [completed]);
  useEffect(() => { try { localStorage.setItem("ail_quizBest", JSON.stringify(quizBest)); } catch {} }, [quizBest]);
  useEffect(() => { try { localStorage.setItem("ail_solved", JSON.stringify(solvedChallenges)); } catch {} }, [solvedChallenges]);

  const track = TRACKS.find((t) => t.id === view.trackId);

  return (
    <div style={{ ...Body, minHeight: "100vh", background: C.paper, color: C.ink }}>
      <header style={{ borderBottom: `1px solid ${C.line}`, background: C.card }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="26" height="26" viewBox="0 0 26 26">
            <circle cx="6" cy="13" r="4" fill={C.teal} />
            <circle cx="20" cy="6" r="3.5" fill={C.amber} />
            <circle cx="20" cy="20" r="3.5" fill={C.blue} />
            <line x1="9" y1="11.5" x2="17" y2="7" stroke={C.ink} strokeWidth="1.6" />
            <line x1="9" y1="14.5" x2="17" y2="19" stroke={C.ink} strokeWidth="1.6" />
          </svg>
          <button onClick={() => setView({ screen: "home" })} style={{ ...Display, background: "none", border: "none", fontSize: 18, fontWeight: 700, color: C.ink, padding: 0 }}>
            AI Literacy Academy
          </button>
          <span style={{ marginLeft: "auto", fontSize: 13, color: C.inkSoft }}>
            {Object.keys(completed).length}/31 lessons · {Object.keys(solvedChallenges).length} challenges
          </span>
          {session ? (
            <button onClick={onSignOut} style={{ ...Body, marginLeft: 16, padding: "7px 14px", borderRadius: 7, border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Sign out
            </button>
          ) : (
            <button onClick={onSignIn} style={{ ...Body, marginLeft: 16, padding: "7px 14px", borderRadius: 7, border: "none", background: C.teal, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Sign in
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 64px" }}>
        {view.screen === "home" && (
          <Home completed={completed} quizBest={quizBest} solvedChallenges={solvedChallenges}
            onPick={(id) => setView({ screen: "track", trackId: id })}
            onExplore={() => setView({ screen: "explore" })} />
        )}
        {view.screen === "explore" && (
          <EncyclopediaView onBack={() => setView({ screen: "home" })} />
        )}
        {view.screen === "track" && track && (
          <TrackView track={track} completed={completed} quizBest={quizBest} solvedChallenges={solvedChallenges}
            session={session} onSignIn={onSignIn}
            onBack={() => setView({ screen: "home" })}
            onLesson={(i) => setView({ screen: "lesson", trackId: track.id, lessonIdx: i })}
            onQuiz={() => setView({ screen: "quiz", trackId: track.id })}
            onLab={() => setView({ screen: "lab", trackId: track.id })} />
        )}
        {view.screen === "lesson" && track && (
          <LessonView track={track} idx={view.lessonIdx}
            session={session} onSignIn={onSignIn}
            onBack={() => setView({ screen: "track", trackId: track.id })}
            onComplete={() => {
              const lesson = track.lessons[view.lessonIdx];
              setCompleted((c) => ({ ...c, [lesson.id]: true }));
              const next = view.lessonIdx + 1;
              if (next < track.lessons.length) setView({ screen: "lesson", trackId: track.id, lessonIdx: next });
              else setView({ screen: "quiz", trackId: track.id });
            }} />
        )}
        {view.screen === "quiz" && track && (
          <QuizView track={track}
            onBack={() => setView({ screen: "track", trackId: track.id })}
            onScore={(s) => setQuizBest((b) => ({ ...b, [track.id]: Math.max(b[track.id] || 0, s) }))} />
        )}
        {view.screen === "lab" && track && (
          <PracticeLab track={track}
            session={session} onSignIn={onSignIn}
            solvedChallenges={solvedChallenges}
            onSolved={(id) => setSolvedChallenges((s) => ({ ...s, [id]: true }))}
            onBack={() => setView({ screen: "track", trackId: track.id })} />
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${C.line}`, background: C.card, padding: "28px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div style={{ ...Display, fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Avants AI</div>
          <div style={{ ...Body, fontSize: 12.5, color: C.inkSoft, marginBottom: 10 }}>
            © 2026 Avants AI &amp; Minorities in STEM · All rights reserved
          </div>
          <div style={{ width: 48, height: 1, background: C.line, margin: "0 auto 10px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 16 }}>
            <span style={{ ...Body, fontSize: 12, color: C.inkSoft }}>
              Empowering <strong style={{ color: C.ink }}>Minorities in STEM</strong> through AI education
            </span>
            <span style={{ color: C.line }}>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ ...Body, fontSize: 12, color: C.inkSoft }}>In partnership with</span>
              <svg style={{ display: "block" }} width="88" height="18" viewBox="0 0 88 18" fill="none">
                <rect x="0" y="0" width="8" height="8" fill="#F25022"/>
                <rect x="9" y="0" width="8" height="8" fill="#7FBA00"/>
                <rect x="0" y="9" width="8" height="8" fill="#00A4EF"/>
                <rect x="9" y="9" width="8" height="8" fill="#FFB900"/>
                <text x="21" y="13" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 12, fontWeight: 600 }} fill={C.ink}>Microsoft</text>
              </svg>
            </span>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}

/* ===================== HOME ===================== */

const TRACK_ICONS = {
  beginner: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  intermediate: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  expert: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><circle cx="3" cy="6" r="2"/><circle cx="21" cy="6" r="2"/><circle cx="3" cy="18" r="2"/><circle cx="21" cy="18" r="2"/>
      <line x1="5" y1="6" x2="9" y2="11"/><line x1="19" y1="6" x2="15" y2="11"/><line x1="5" y1="18" x2="9" y2="13"/><line x1="19" y1="18" x2="15" y2="13"/>
    </svg>
  ),
};

function Home({ completed, quizBest, solvedChallenges, onPick, onExplore }) {
  const totalLessons    = TRACKS.reduce((a, t) => a + t.lessons.length, 0);
  const totalChallenges = TRACKS.reduce((a, t) => a + t.challenges.length, 0);
  const doneLessons     = TRACKS.reduce((a, t) => a + t.lessons.filter((l) => completed[l.id]).length, 0);
  const doneChallenges  = TRACKS.reduce((a, t) => a + t.challenges.filter((c) => solvedChallenges[c.id]).length, 0);
  const totalExercises  = Object.values(LESSON_EXERCISES).reduce((a, arr) => a + arr.length, 0);

  return (
    <div className="fadeUp">
      {/* hero banner */}
      <div style={{ background: `linear-gradient(135deg, ${C.ink} 0%, #1A3A40 100%)`, borderRadius: 18, padding: "40px 36px 36px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `${C.teal}22` }} />
        <div style={{ position: "absolute", bottom: -30, right: 80, width: 120, height: 120, borderRadius: "50%", background: `${C.amber}18` }} />
        <p style={{ ...Mono, fontSize: 11, letterSpacing: 2.5, color: C.teal, textTransform: "uppercase", margin: "0 0 10px" }}>
          Minorities in STEM · Avants AI
        </p>
        <h1 style={{ ...Display, fontSize: 38, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.1, color: "#fff" }}>
          Learn AI at your level.
        </h1>
        <p style={{ color: "#9BBFBB", fontSize: 15, maxWidth: 540, lineHeight: 1.65, margin: "0 0 28px" }}>
          {totalLessons} lessons · {totalChallenges} coding challenges · {totalExercises} hands-on exercises.
          Read deeply, write real Python, pass the quizzes, look anything up in the Encyclopedia.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Lessons done",     val: `${doneLessons}/${totalLessons}`,       color: C.teal },
            { label: "Challenges solved", val: `${doneChallenges}/${totalChallenges}`, color: C.amber },
            { label: "Quiz best",         val: Object.values(quizBest).length ? `${Math.max(...Object.values(quizBest))} pts` : "—", color: C.blue },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,.08)", borderRadius: 10, padding: "10px 16px" }}>
              <div style={{ ...Display, fontSize: 20, fontWeight: 700, color }}>{val}</div>
              <div style={{ ...Mono, fontSize: 10, color: "#7AADA9", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>



      {/* track cards */}
      <div style={{ display: "grid", gap: 14, marginBottom: 14 }}>
        {TRACKS.map((t) => {
          const done   = t.lessons.filter((l) => completed[l.id]).length;
          const solved = t.challenges.filter((c) => solvedChallenges[c.id]).length;
          const exCount= t.lessons.reduce((a, l) => a + (LESSON_EXERCISES[l.id]?.length || 0), 0);
          const best   = quizBest[t.id];
          const pct    = Math.round((done / t.lessons.length) * 100);
          return (
            <button key={t.id} onClick={() => onPick(t.id)}
              style={{ textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${t.color}18`, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
                  {TRACK_ICONS[t.id]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ ...Display, fontSize: 18, fontWeight: 700 }}>{t.label}</span>
                    <span style={{ ...Mono, fontSize: 10, color: t.color, letterSpacing: 1, textTransform: "uppercase", background: `${t.color}15`, borderRadius: 4, padding: "2px 7px" }}>{t.tagline}</span>
                    {pct === 100 && <span style={{ ...Mono, fontSize: 10, color: C.green, background: "#EAF6EE", borderRadius: 4, padding: "2px 7px" }}>✓ Complete</span>}
                  </div>
                  <p style={{ color: C.inkSoft, fontSize: 13.5, margin: "0 0 12px", lineHeight: 1.5 }}>{t.description}</p>
                  <ProgressBar done={done} total={t.lessons.length} color={t.color} />
                  <div style={{ ...Mono, fontSize: 11, color: C.inkSoft, marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span>{t.lessons.length} lessons</span>
                    <span>{exCount} exercises</span>
                    <span>{solved}/{t.challenges.length} challenges</span>
                    {best != null && <span style={{ color: t.color }}>Best quiz: {best}/{t.quiz.length}</span>}
                  </div>
                </div>
                <span style={{ color: t.color, fontSize: 20, alignSelf: "center", flexShrink: 0 }}>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* encyclopedia */}
      <button onClick={onExplore}
        style={{ width: "100%", textAlign: "left", background: C.ink, border: "none", borderRadius: 14, padding: "22px 24px", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.amber}25`, display: "grid", placeItems: "center", flexShrink: 0, color: C.amber }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...Display, fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 4 }}>AI Encyclopedia</div>
          <p style={{ ...Body, color: "#8BBFBB", fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
            {ENCYCLOPEDIA.length} terms explained in plain language — ChatGPT to TensorFlow to RLHF. Ask the AI to re-explain anything.
          </p>
        </div>
        <span style={{ color: C.amber, fontSize: 20, flexShrink: 0 }}>→</span>
      </button>
    </div>
  );
}

/* ===================== TRACK VIEW (module-grouped) ===================== */

function TrackView({ track, completed, quizBest, solvedChallenges, session, onSignIn, onBack, onLesson, onQuiz, onLab }) {
  const solved  = track.challenges.filter((c) => solvedChallenges[c.id]).length;
  const done    = track.lessons.filter((l) => completed[l.id]).length;
  const modules = [...new Set(track.lessons.map((l) => l.module))];
  const exCount = track.lessons.reduce((a, l) => a + (LESSON_EXERCISES[l.id]?.length || 0), 0);

  return (
    <div className="fadeUp">
      <button onClick={onBack} style={backBtn}>← All tracks</button>

      {/* track header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0 6px" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${track.color}18`, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
          {TRACK_ICONS[track.id]}
        </div>
        <div>
          <h1 style={{ ...Display, fontSize: 26, fontWeight: 800, margin: 0 }}>{track.label} track</h1>
          <p style={{ color: C.inkSoft, margin: "2px 0 0", fontSize: 13.5, lineHeight: 1.5 }}>{track.description}</p>
        </div>
      </div>

      {/* progress + stats row */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 20px", margin: "14px 0 24px" }}>
        <ProgressBar done={done} total={track.lessons.length} color={track.color} />
        <div style={{ ...Mono, fontSize: 11, color: C.inkSoft, marginTop: 10, display: "flex", gap: 18, flexWrap: "wrap" }}>
          <span>{done}/{track.lessons.length} lessons complete</span>
          <span>{exCount} coding exercises</span>
          <span>{solved}/{track.challenges.length} challenges solved</span>
          {quizBest[track.id] != null && <span style={{ color: track.color }}>Best quiz: {quizBest[track.id]}/{track.quiz.length}</span>}
        </div>
      </div>

      {/* modules */}
      {modules.map((mod) => {
        const lessons = track.lessons.filter((l) => l.module === mod);
        const modDone = lessons.filter((l) => completed[l.id]).length;
        return (
          <div key={mod} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <h2 style={{ ...Mono, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: track.color, margin: 0 }}>{mod}</h2>
              <div style={{ flex: 1, height: 1, background: C.line }} />
              <span style={{ ...Mono, fontSize: 11, color: C.inkSoft }}>{modDone}/{lessons.length}</span>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {lessons.map((l) => {
                const i    = track.lessons.indexOf(l);
                const exs  = (LESSON_EXERCISES[l.id] || []).length;
                const done = completed[l.id];
                return (
                  <button key={l.id} onClick={() => onLesson(i)}
                    style={{ textAlign: "left", background: done ? `${track.color}08` : C.card, border: `1px solid ${done ? track.color + "40" : C.line}`, borderRadius: 10, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: done ? track.color : C.paper, border: `2px solid ${done ? track.color : C.line}`, color: done ? "#fff" : C.inkSoft, ...Mono, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {done ? "✓" : i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...Display, fontWeight: 600, fontSize: 14.5 }}>{l.title}</div>
                      <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span>{l.minutes} min</span>
                        <span>{l.sections.length} sections</span>
                        {l.sections.some((s) => s.code) && <span style={{ color: track.color }}>includes code</span>}
                        {exs > 0 && <span style={{ color: track.color }}>▶ {exs} exercise{exs > 1 ? "s" : ""}</span>}
                      </div>
                    </div>
                    <span style={{ color: track.color, fontSize: 16 }}>→</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* action cards */}
      <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
        <button onClick={onQuiz} style={{ textAlign: "left", background: C.amberSoft, border: `1px solid ${C.amber}40`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.amber, display: "grid", placeItems: "center", color: "#fff", fontSize: 16, flexShrink: 0 }}>★</div>
          <div style={{ flex: 1 }}>
            <div style={{ ...Display, fontWeight: 700, fontSize: 15 }}>Quiz — {track.label}</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>
              {track.quiz.length} questions{quizBest[track.id] != null && ` · best: ${quizBest[track.id]}/${track.quiz.length}`} · plus unlimited AI-generated sets
            </div>
          </div>
          <span style={{ color: C.amber, fontSize: 18 }}>→</span>
        </button>

        <button onClick={session ? onLab : onSignIn} style={{ textAlign: "left", background: C.codeBg, border: `1px solid rgba(255,255,255,.06)`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: track.color, display: "grid", placeItems: "center", color: "#fff", ...Mono, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            {session ? ">_" : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...Display, fontWeight: 700, fontSize: 15, color: "#fff" }}>Practice Lab{!session && " — sign in to unlock"}</div>
            <div style={{ fontSize: 12.5, color: "#9FB8B4", marginTop: 2 }}>
              {session ? `${solved}/${track.challenges.length} challenges solved · real Python · AI mentor feedback` : "Create a free account to write and run real Python"}
            </div>
          </div>
          <span style={{ color: track.color, fontSize: 18 }}>→</span>
        </button>
      </div>
    </div>
  );
}

/* ===================== LESSON ===================== */

function LessonView({ track, idx, session, onSignIn, onBack, onComplete }) {
  const lesson = track.lessons[idx];
  const isLast = idx === track.lessons.length - 1;
  const exercises = LESSON_EXERCISES[lesson.id] || [];

  return (
    <div className="fadeUp" key={lesson.id}>
      {/* breadcrumb + progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={backBtn}>← {track.label}</button>
        <div style={{ flex: 1, height: 4, background: C.line, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${((idx + 1) / track.lessons.length) * 100}%`, height: "100%", background: track.color, borderRadius: 2, transition: "width .4s" }} />
        </div>
        <span style={{ ...Mono, fontSize: 11, color: C.inkSoft }}>{idx + 1}/{track.lessons.length}</span>
      </div>

      {/* lesson header */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `5px solid ${track.color}`, borderRadius: 12, padding: "20px 24px", marginBottom: 22 }}>
        <p style={{ ...Mono, fontSize: 11, color: track.color, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 6px" }}>
          {lesson.module} · {lesson.minutes} min read
        </p>
        <h1 style={{ ...Display, fontSize: 28, fontWeight: 700, margin: 0 }}>{lesson.title}</h1>
      </div>

      {/* sections */}
      {lesson.sections.map((s, i) => (
        <section key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "22px 26px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ ...Mono, fontSize: 11, fontWeight: 700, color: track.color, background: `${track.color}18`, borderRadius: 20, padding: "2px 10px" }}>{i + 1}</span>
            <h2 style={{ ...Display, fontSize: 17, fontWeight: 700, margin: 0 }}>{s.heading}</h2>
          </div>
          <p style={{ margin: 0, lineHeight: 1.75, fontSize: 15, color: "#26363F" }}>{s.body}</p>
          {s.code && <CodeBlock code={s.code} />}
        </section>
      ))}

      {/* key terms */}
      <section style={{ background: C.tealSoft, border: `1px solid ${C.teal}30`, borderRadius: 12, padding: "18px 24px", marginBottom: exercises.length ? 6 : 24 }}>
        <h3 style={{ ...Display, fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: C.teal, letterSpacing: .5, textTransform: "uppercase" }}>Key terms</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "6px 20px" }}>
          {lesson.keyTerms.map(([term, def]) => (
            <div key={term} style={{ fontSize: 13.5, lineHeight: 1.55 }}>
              <strong style={{ ...Display, color: C.ink }}>{term}</strong>
              <span style={{ color: C.inkSoft }}> — {def}</span>
            </div>
          ))}
        </div>
      </section>

      {/* coding exercises */}
      {exercises.length > 0 && !session && (
        <div style={{ background: "#0C1A1D", borderRadius: 12, padding: "22px 24px", margin: "22px 0 24px", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ color: "#7AADA9" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ ...Display, fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 3 }}>
              {exercises.length} coding exercise{exercises.length > 1 ? "s" : ""} in this lesson
            </div>
            <div style={{ fontSize: 13, color: "#9FB8B4", lineHeight: 1.5 }}>
              Sign in for free to write and run real Python exercises right here in your browser.
            </div>
          </div>
          <button onClick={onSignIn} style={{ ...Display, background: track.color, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
            Sign in to practice
          </button>
        </div>
      )}
      {exercises.length > 0 && session && (
        <div style={{ marginTop: 22, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ ...Mono, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: track.color, fontWeight: 700 }}>Practice — write & run code</span>
            <div style={{ flex: 1, height: 1, background: C.line }} />
          </div>
          <p style={{ ...Body, fontSize: 13, color: C.inkSoft, margin: "4px 0 10px" }}>
            Reinforce what you just read. Each exercise runs real Python in your browser.
          </p>
          {exercises.map((ex) => (
            <div key={ex.id} style={{ marginBottom: 16 }}>
              <p style={{ ...Display, fontWeight: 700, fontSize: 14, margin: "0 0 2px", color: C.ink }}>{ex.title}</p>
              <InlineCodingExercise exercise={ex} color={track.color} />
            </div>
          ))}
        </div>
      )}

      <button onClick={onComplete} style={{ ...primaryBtn(track.color), width: "100%", padding: "14px 24px", fontSize: 15 }}>
        {isLast ? "Finish lessons → take the quiz" : "Mark complete → next lesson →"}
      </button>
    </div>
  );
}

/* ===================== QUIZ ===================== */

function QuizView({ track, onBack, onScore }) {
  const [questions, setQuestions] = useState(track.quiz);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);

  const q = questions[i];
  const reset = (qs) => { setQuestions(qs); setI(0); setPicked(null); setScore(0); setFinished(false); };

  async function generateNew() {
    setGenLoading(true); setGenError(null);
    try {
      const text = await callAI({
        prompt: `Generate 6 multiple-choice quiz questions for a ${track.label}-level AI/ML learner. Topics: ${track.lessons.map((l) => l.title).join("; ")}. Respond with ONLY a JSON array, no markdown fences or preamble. Each item: {"q": string, "options": [4 strings], "answer": index 0-3, "explain": one-sentence explanation}. Make questions specific and different from typical textbook examples.`,
      });
      const parsed = parseJSONLoose(text);
      if (!Array.isArray(parsed) || !parsed[0]?.options) throw new Error("Bad format");
      reset(parsed);
    } catch (e) {
      setGenError(
        e.message === "RATE_LIMIT" ? "You've hit today's limit — come back tomorrow for fresh AI-made sets."
        : e.message === "NO_KEY" ? "OpenAI key not configured. Add VITE_OPENAI_KEY to your .env file."
        : "Couldn't generate questions right now. Try again in a moment.");
    } finally { setGenLoading(false); }
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <div className="fadeUp" style={{ textAlign: "center", paddingTop: 40 }}>
        <div style={{ ...Display, fontSize: 56, fontWeight: 700, color: passed ? track.color : C.amber }}>{score}/{questions.length}</div>
        <h2 style={{ ...Display, fontSize: 24, margin: "8px 0" }}>
          {pct === 100 ? "Perfect score!" : passed ? "Solid work — you passed." : "Good effort — review and retry."}
        </h2>
        <p style={{ color: C.inkSoft, maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.6 }}>
          {passed
            ? "You've got a real handle on this material. Generate a fresh AI-made set, or head to the Practice Lab to start coding."
            : "Revisit the lessons that tripped you up — each question's explanation points to what to review."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => reset(track.quiz)} style={primaryBtn(track.color)}>Retake quiz</button>
          <button onClick={generateNew} disabled={genLoading} style={outlineBtn(track.color)}>
            {genLoading ? "Generating…" : "✦ New AI-generated questions"}
          </button>
          <button onClick={onBack} style={outlineBtn(C.inkSoft)}>Back to track</button>
        </div>
        {genError && <p style={{ color: C.red, fontSize: 14, marginTop: 16 }}>{genError}</p>}
      </div>
    );
  }

  return (
    <div className="fadeUp" key={i}>
      <button onClick={onBack} style={backBtn}>← {track.label} track</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 8px", flexWrap: "wrap", gap: 8 }}>
        <p style={{ ...Mono, fontSize: 12, color: track.color, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>
          Question {i + 1} of {questions.length}
        </p>
        <div style={{ flex: "0 1 260px" }}>
          <ProgressBar done={i + (picked !== null ? 1 : 0)} total={questions.length} color={track.color} />
        </div>
      </div>
      <h1 style={{ ...Display, fontSize: 24, fontWeight: 700, margin: "0 0 20px", lineHeight: 1.35 }}>{q.q}</h1>

      <div style={{ display: "grid", gap: 10 }}>
        {q.options.map((opt, oi) => {
          const isAnswer = oi === q.answer;
          const isPicked = picked === oi;
          let bg = C.card, border = C.line;
          if (picked !== null) {
            if (isAnswer) { bg = "#EAF6EE"; border = C.green; }
            else if (isPicked) { bg = "#FBECE9"; border = C.red; }
          }
          return (
            <button key={oi} disabled={picked !== null}
              onClick={() => { setPicked(oi); if (oi === q.answer) setScore((s) => s + 1); }}
              style={{ textAlign: "left", background: bg, border: `2px solid ${border}`, borderRadius: 10, padding: "14px 18px", fontSize: 15, lineHeight: 1.5, color: C.ink, opacity: 1 }}>
              <span style={{ ...Mono, color: C.inkSoft, marginRight: 10 }}>{String.fromCharCode(65 + oi)}</span>
              {opt}
              {picked !== null && isAnswer && <span style={{ color: C.green, marginLeft: 8 }}>✓</span>}
              {picked !== null && isPicked && !isAnswer && <span style={{ color: C.red, marginLeft: 8 }}>✗</span>}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="fadeUp" style={{ marginTop: 16 }}>
          <div style={{ background: C.tealSoft, borderRadius: 10, padding: "14px 18px", fontSize: 14, lineHeight: 1.6 }}>
            <strong style={Display}>{picked === q.answer ? "Correct. " : "Not quite. "}</strong>{q.explain}
          </div>
          <button
            onClick={() => {
              if (i + 1 < questions.length) { setI(i + 1); setPicked(null); }
              else { setFinished(true); onScore(score); }
            }}
            style={{ ...primaryBtn(track.color), marginTop: 14 }}>
            {i + 1 < questions.length ? "Next question →" : "See results"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ===================== ENCYCLOPEDIA ===================== */

const LEVEL_META = {
  beginner: { label: "Beginner", color: C.teal, blurb: "Everyday AI tools — the apps regular people use." },
  intermediate: { label: "Intermediate", color: C.blue, blurb: "The builder's toolkit — languages, libraries, and environments." },
  expert: { label: "Expert", color: C.purple, blurb: "Deep learning frameworks, architectures, and production." },
};

function EncyclopediaView({ onBack }) {
  const [level, setLevel] = useState("beginner");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);
  const [explain, setExplain] = useState({});

  const entries = ENCYCLOPEDIA.filter((e) => {
    const matchesLevel = level === "all" || e.level === level;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.what.toLowerCase().includes(q);
    return matchesLevel && matchesSearch;
  });

  async function reExplain(entry, style) {
    setExplain((x) => ({ ...x, [entry.name]: { loading: true } }));
    const styles = {
      simpler: "even simpler, as if to a 10-year-old, using one everyday analogy",
      analogy: "using one vivid real-world analogy (kitchen, sports, or school)",
      deeper: "at a more technical depth, including how it works under the hood",
    };
    try {
      const text = await callAI({
        maxTokens: 350,
        prompt: `In a learn-AI app, a learner wants "${entry.name}" (${entry.category}) explained ${styles[style]}. Base definition: ${entry.what} ${entry.does} Respond with 3-4 plain sentences only — no markdown, no preamble.`,
      });
      setExplain((x) => ({ ...x, [entry.name]: { text: text.trim() } }));
    } catch (e) {
      setExplain((x) => ({
        ...x,
        [entry.name]: {
          error: e.message === "RATE_LIMIT"
            ? "You've reached today's AI usage limit — try again tomorrow."
            : e.message === "NO_KEY"
            ? "AI explanations require an OpenAI key — contact the site admin."
            : "The AI tutor is unreachable right now — try again in a moment.",
        },
      }));
    }
  }

  return (
    <div className="fadeUp">
      <button onClick={onBack} style={backBtn}>← Home</button>
      <h1 style={{ ...Display, fontSize: 32, fontWeight: 700, margin: "16px 0 6px" }}>AI Encyclopedia</h1>
      <p style={{ color: C.inkSoft, margin: "0 0 20px", lineHeight: 1.6, maxWidth: 620 }}>
        Every tool and term, demystified: <strong>what it is</strong>, <strong>what it does</strong>, and{" "}
        <strong>a real example</strong>. If an explanation doesn't click, ask the AI to say it differently.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
        {["beginner", "intermediate", "expert", "all"].map((id) => {
          const meta = LEVEL_META[id];
          const activeColor = meta ? meta.color : C.ink;
          const isActive = level === id;
          return (
            <button key={id} onClick={() => setLevel(id)}
              style={{ ...Display, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 20, border: `2px solid ${isActive ? activeColor : C.line}`, background: isActive ? activeColor : C.card, color: isActive ? "#fff" : C.ink }}>
              {meta ? meta.label : "All levels"}
            </button>
          );
        })}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools & terms…"
          style={{ ...Body, fontSize: 13.5, padding: "9px 14px", border: `1px solid ${C.line}`, borderRadius: 20, flex: "1 1 180px", minWidth: 160 }} />
      </div>
      {LEVEL_META[level] && (
        <p style={{ ...Mono, fontSize: 12, color: LEVEL_META[level].color, margin: "0 0 16px" }}>{LEVEL_META[level].blurb}</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {entries.length === 0 && <p style={{ color: C.inkSoft, fontSize: 14 }}>No matches — try a different search term or level.</p>}
        {entries.map((e) => {
          const meta = LEVEL_META[e.level];
          const isOpen = open === e.name;
          const ex = explain[e.name];
          return (
            <div key={e.name} style={{ background: C.card, border: `1px solid ${isOpen ? meta.color : C.line}`, borderRadius: 12, overflow: "hidden" }}>
              <button onClick={() => setOpen(isOpen ? null : e.name)}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ ...Display, fontWeight: 700, fontSize: 16.5 }}>{e.name}</span>
                  <span style={{ ...Mono, fontSize: 11, color: meta.color, marginLeft: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    {e.category} · {meta.label}
                  </span>
                  {!isOpen && <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 4, lineHeight: 1.5 }}>{e.what}</div>}
                </div>
                <span style={{ color: meta.color, fontSize: 18, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }}>→</span>
              </button>

              {isOpen && (
                <div className="fadeUp" style={{ padding: "0 20px 18px" }}>
                  <Row label="What it is" color={meta.color} text={e.what} />
                  <Row label="What it does" color={meta.color} text={e.does} />
                  <Row label="Example" color={meta.color} text={e.example} mono />

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
                    <span style={{ ...Mono, fontSize: 11, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1 }}>✦ Re-explain via AI:</span>
                    {[["simpler", "Even simpler"], ["analogy", "With an analogy"], ["deeper", "Go deeper"]].map(([id, label]) => (
                      <button key={id} onClick={() => reExplain(e, id)} disabled={ex?.loading} style={smallBtn(meta.color, false)}>{label}</button>
                    ))}
                  </div>
                  {ex?.loading && <p className="pulse" style={{ ...Mono, fontSize: 12.5, color: C.inkSoft, margin: "10px 0 0" }}>AI is thinking…</p>}
                  {ex?.text && (
                    <div className="fadeUp" style={{ marginTop: 10, background: C.tealSoft, borderRadius: 10, padding: "12px 16px", fontSize: 14, lineHeight: 1.7 }}>{ex.text}</div>
                  )}
                  {ex?.error && <p style={{ color: C.red, fontSize: 13, margin: "10px 0 0" }}>{ex.error}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, color, text, mono }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ ...Mono, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "#26363F", ...(mono ? { fontStyle: "italic" } : {}) }}>{text}</div>
    </div>
  );
}

/* ===================== PRACTICE LAB ===================== */

function PracticeLab({ track, session, onSignIn, solvedChallenges, onSolved, onBack }) {
  const SANDBOX = {
    id: "sandbox", title: "Free sandbox", runnable: true,
    prompt: "No assignment — this is your scratchpad. Try out any idea: loops, functions, math, mini experiments. Run it for real, or ask the AI mentor for feedback on whatever you build.",
    starter: `# Your playground. Write any Python and press Run.
for i in range(3):
    print("Idea number", i + 1)
`,
    hint: "Stuck for ideas? Try: a function that counts vowels in a string, or FizzBuzz, or simulating 100 coin flips with the random module.",
  };

  const [challenges, setChallenges] = useState([...track.challenges, SANDBOX]);
  const [active, setActive] = useState(0);
  const [code, setCode] = useState(challenges[0].starter);
  const [output, setOutput] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [running, setRunning] = useState(false);
  const [pyStatus, setPyStatus] = useState("idle");
  const [aiLoading, setAiLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const codeRef = useRef(null);

  const ch = challenges[active];

  function pick(i) {
    setActive(i); setCode(challenges[i].starter);
    setOutput(null); setFeedback(null); setShowHint(false);
  }

  async function run() {
    setRunning(true); setOutput(null);
    try {
      if (pyStatus !== "ready") setPyStatus("loading");
      const py = await loadPy();
      setPyStatus("ready");
      let buf = "";
      py.setStdout({ batched: (s) => { buf += s + "\n"; } });
      py.setStderr({ batched: (s) => { buf += s + "\n"; } });
      try {
        await py.runPythonAsync(code);
        setOutput({ ok: true, text: buf.trim() || "(program ran — no output. Add a print() to see results!)" });
      } catch (err) {
        const msg = String(err.message || err);
        const tail = msg.split("\n").filter((l) => l.trim()).slice(-3).join("\n");
        setOutput({ ok: false, text: (buf ? buf + "\n" : "") + tail });
      }
    } catch (e) {
      setPyStatus("failed");
      setOutput({ ok: false, text: "The in-browser Python runtime couldn't load (network restriction?). Use the AI Feedback button instead — the mentor will trace through your code and tell you what it outputs." });
    } finally { setRunning(false); }
  }

  async function getFeedback() {
    setAiLoading(true); setFeedback(null);
    try {
      const text = await callAI({
        maxTokens: 700,
        prompt: `You are a friendly coding mentor in a learn-AI app. The learner is on the ${track.label} track.
Challenge: "${ch.title}" — ${ch.prompt}
Their code:
\`\`\`python
${code}
\`\`\`
${output ? `When run, it produced:\n${output.text}` : "It has not been run."}
Respond with ONLY a JSON object, no fences: {"solved": true/false (does the code correctly accomplish the challenge?), "feedback": "3-5 sentences: what they did well, what to fix or improve, one concrete next step. Plain language, encouraging, no markdown."}`,
      });
      const parsed = parseJSONLoose(text);
      setFeedback(parsed);
      if (parsed.solved && ch.id !== "sandbox") onSolved(ch.id);
    } catch (e) {
      setFeedback({
        solved: false,
        feedback: e.message === "RATE_LIMIT"
          ? "You've reached today's AI usage limit. Your code still runs with the Run button — come back tomorrow for mentor feedback."
          : e.message === "NO_KEY"
          ? "AI mentor requires an OpenAI key — contact the site admin."
          : "The AI mentor is unreachable right now — try again in a moment.",
      });
    } finally { setAiLoading(false); }
  }

  async function generateChallenge() {
    setGenLoading(true); setGenError(null);
    try {
      const text = await callAI({
        maxTokens: 600,
        prompt: `Create ONE new Python coding challenge for a ${track.label}-level AI/ML learner. It must be solvable in plain Python (no external libraries — no numpy, pandas, sklearn, tensorflow). Theme it around AI/ML concepts from this curriculum: ${track.lessons.slice(0, 8).map((l) => l.title).join("; ")}. Respond with ONLY a JSON object, no fences: {"title": short title, "prompt": 2-3 sentence task with the expected output stated, "starter": starter code string with helpful comments, "hint": one-sentence hint}.`,
      });
      const parsed = parseJSONLoose(text);
      const newCh = { ...parsed, id: "gen" + Date.now(), runnable: true, generated: true };
      const next = [...challenges];
      next.splice(challenges.length - 1, 0, newCh);
      setChallenges(next);
      setActive(next.length - 2);
      setCode(newCh.starter);
      setOutput(null); setFeedback(null); setShowHint(false);
    } catch (e) {
      setGenError(
        e.message === "RATE_LIMIT" ? "You've hit today's AI limit — come back tomorrow for new challenges."
        : e.message === "NO_KEY" ? "AI challenge generation requires an OpenAI key — contact the site admin."
        : "Couldn't generate a challenge right now — try again.");
    } finally { setGenLoading(false); }
  }

  function handleTab(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = codeRef.current;
      const s = el.selectionStart, en = el.selectionEnd;
      const next = code.slice(0, s) + "    " + code.slice(en);
      setCode(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  }

  return (
    <div className="fadeUp">
      <button onClick={onBack} style={backBtn}>← {track.label} track</button>
      <h1 style={{ ...Display, fontSize: 30, fontWeight: 700, margin: "16px 0 4px" }}>Practice Lab</h1>
      <p style={{ color: C.inkSoft, margin: "0 0 20px", lineHeight: 1.6, maxWidth: 620 }}>
        Write real Python and run it right here in your browser. The AI mentor reviews your code,
        checks your solution, and can invent brand-new challenges when you want more.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {challenges.map((c, i) => (
          <button key={c.id} onClick={() => pick(i)}
            style={{ ...Display, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 20, border: `2px solid ${i === active ? track.color : C.line}`, background: i === active ? track.color : C.card, color: i === active ? "#fff" : C.ink }}>
            {solvedChallenges[c.id] ? "✓ " : ""}{c.generated ? "✦ " : ""}{c.title}
          </button>
        ))}
        <button onClick={generateChallenge} disabled={genLoading}
          style={{ ...Display, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 20, border: `2px dashed ${C.amber}`, background: C.amberSoft, color: "#9A6A1B" }}>
          {genLoading ? "Creating…" : "+ New AI challenge"}
        </button>
      </div>
      {genError && <p style={{ color: C.red, fontSize: 13, margin: "0 0 12px" }}>{genError}</p>}

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `5px solid ${track.color}`, borderRadius: 10, padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ ...Display, fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{ch.title}</div>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: "#26363F" }}>{ch.prompt}</p>
        {!ch.runnable && (
          <p style={{ ...Mono, margin: "10px 0 0", fontSize: 12, color: C.purple }}>
            ⓘ Uses ML libraries — graded by the AI mentor rather than run in-browser.
          </p>
        )}
        <button onClick={() => setShowHint(!showHint)}
          style={{ ...Mono, marginTop: 10, background: "none", border: "none", color: track.color, fontSize: 12.5, padding: 0, textDecoration: "underline" }}>
          {showHint ? "Hide hint" : "Show hint"}
        </button>
        {showHint && <p style={{ margin: "8px 0 0", fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6 }}>{ch.hint}</p>}
      </div>

      <textarea
        ref={codeRef} value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleTab} spellCheck={false}
        rows={Math.max(10, code.split("\n").length + 2)}
        style={{ ...Mono, width: "100%", background: C.codeBg, color: C.codeText, border: "none", borderRadius: "10px 10px 0 0", padding: "16px 18px", fontSize: 13.5, lineHeight: 1.7, resize: "vertical" }}
      />
      <div style={{ background: "#1A2A2E", borderRadius: "0 0 10px 10px", padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {ch.runnable && (
          <button onClick={run} disabled={running} style={smallBtn("#48BB78", true)}>
            {running ? (pyStatus === "loading" ? "Loading Python…" : "Running…") : "▶ Run code"}
          </button>
        )}
        <button onClick={getFeedback} disabled={aiLoading} style={smallBtn(C.amber, true)}>
          {aiLoading ? "Mentor is reading…" : "✦ AI Feedback"}
        </button>
        <button onClick={() => { setCode(ch.starter); setOutput(null); setFeedback(null); }}
          style={{ ...Mono, background: "none", border: "none", color: "#9FB8B4", fontSize: 12 }}>
          Reset code
        </button>
        {pyStatus === "loading" && <span className="pulse" style={{ ...Mono, fontSize: 11, color: "#9FB8B4" }}>first run downloads Python (~10s)…</span>}
      </div>

      {output && (
        <div className="fadeUp" style={{ marginTop: 14 }}>
          <div style={{ ...Mono, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: output.ok ? C.green : C.red, marginBottom: 6 }}>
            {output.ok ? "Output" : "Error"}
          </div>
          <pre style={{ ...Mono, background: output.ok ? "#0E1F16" : "#241113", color: output.ok ? "#A8E6C1" : "#F3B8AE", borderRadius: 10, padding: "14px 18px", fontSize: 13, lineHeight: 1.6, overflowX: "auto", margin: 0, whiteSpace: "pre-wrap" }}>
            {output.text}
          </pre>
        </div>
      )}

      {feedback && (
        <div className="fadeUp" style={{ marginTop: 14, background: feedback.solved ? "#EAF6EE" : C.amberSoft, border: `1px solid ${feedback.solved ? C.green : C.amber}`, borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ ...Display, fontWeight: 700, fontSize: 15, marginBottom: 6, color: feedback.solved ? C.green : "#9A6A1B" }}>
            {feedback.solved ? "✓ Challenge solved — mentor approved!" : "Mentor feedback"}
          </div>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7 }}>{feedback.feedback}</p>
        </div>
      )}

    </div>
  );
}
