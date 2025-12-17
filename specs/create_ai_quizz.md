# Specificație: Creare Quiz cu AI (Alteus.ai)

## Obiectiv
Să existe un flux nou de **creare quiz cu AI** care, pornind de la inputul userului (titlu + scop), produce:
- **descriere** (editabilă)
- **10 întrebări** (cu opțiuni), marcarea răspunsului corect și **explicație**
- posibilitatea de **„Generate 10 more”**
- posibilitatea de **„Regenerare opțiuni”** pentru o întrebare (fără a modifica enunțul)

## UI / Navigație
- În zona de **Create Quiz** se adaugă un buton nou, **sub** butonul existent.
  - Aspect: similar cu butonul existent, dar cu **icon AI** (nu icon „+”).
- Butonul deschide pagina dedicată: **Create Quiz (AI)**.

## Pagina „Create Quiz (AI)” – câmpuri și acțiuni
### Form
- **Title** (obligatoriu)
- **Goal / Purpose** (obligatoriu) – „scopul quiz-ului”
  - Notă compatibilitate: în implementarea curentă, backend-ul nu are câmp `goal` pe `Quiz`. Acest câmp este folosit pentru generare AI și NU se persistă la save (decât dacă îl mapăm în `description` sau extindem schema DB).
- **Description** (editabil):
  - inițial gol
  - buton: **Generate description** (AI completează pe baza Title + Goal)
  - constrângere UX: text scurt, potrivit layout-ului (fără paragrafe kilometrice)

### Questions
- buton: **Generate questions and options** → generează **10** întrebări.
- buton: **Generate 10 more** → adaugă încă **10** întrebări (fără duplicate).
- fiecare întrebare include:
  - enunț (`text`)
  - 4 opțiuni (`options`)
  - un singur răspuns corect (marcat prin `options[].is_correct = true`)
  - explicație (`explanation`)
- per întrebare: buton **Regenerate options**
  - păstrează enunțul întrebării
  - regenerează doar opțiunile + corectul + explicația

### Save
- **Save quiz**: salvează quiz-ul (Title + Description + Questions).
- Editarea manuală existentă trebuie să rămână funcțională (userul poate edita ce a generat AI).

## Reguli de generare (calitate + dimensiuni)
- Limbă: aceeași cu inputul userului (implicit română).
- 10 întrebări per batch.
- 4 opțiuni per întrebare (recomandat și standardizat).
- 1 singur răspuns corect per întrebare.
- Explicația: 1–3 fraze, clară și la obiect.
- Fără duplicări / near-duplicates atunci când se face „Generate 10 more”.
- Opțiuni plauzibile (fără distractori evident absurzi).
- Output AI trebuie să fie **strict JSON** (machine-readable), fără markdown și fără text extra.

### Constrângeri de spațiu (TV + Mobile/desktop)
Implementarea curentă folosește câmpuri de tip `Input` (single-line) în editor și fonturi mari în layout-ul TV, deci conținutul generat trebuie să fie succint:
- **Title**: max ~60 caractere (fără newline).
- **Description**: max ~120 caractere (single-line; fără newline).
- **Question text**: max ~90 caractere (ideal pentru TV, altfel rupe layout-ul).
- **Option text**: max ~45 caractere (în special pentru TV, 2 coloane, font mare).
- **Explanation**: max ~220 caractere (poate fi 1–3 fraze scurte; fără paragrafe lungi).

Notă implementare (teren pregătit):
- Frontend: limitele sunt aplicate cu `maxLength` + contoare (și `Textarea` pentru Description/Explanation).
- Backend: la `POST /quizzes/` și `PUT /quizzes/{id}` se aplică sanitizare (fără newline, whitespace colapsat) + truncare la limite, ca protecție dacă UI e ocolit.

## Arhitectură / Securitate
- Integrarea cu AI se face prin **Alteus.ai**, conform exemplelor din `specs/info_api_llm_alteus.md`.
- Apelurile către Alteus se fac **doar din backend-ul Python**:
  - token / endpoint_id / config nu ajung în frontend.
- Frontend-ul apelează doar backend-ul propriu (endpoint-uri REST interne).

## Contract de date (model recomandat)
Scop: structură stabilă, ușor de salvat/afișat și compatibilă cu „regenerate options”.
Notă compatibilitate: mai jos este aliniat cu schema existentă din backend (`QuizCreate`, `QuestionCreate`, `AnswerOptionCreate`).

### Quiz draft
```json
{
  "title": "string",
  "description": "string|null",
  "background_image": "string|null",
  "default_time_limit": 30,
  "questions": []
}
```

### Question
```json
{
  "text": "string",
  "time_limit": 30,
  "points": 1000,
  "order": 0,
  "explanation": "string|null",
  "media_url": "string|null",
  "question_type": "single",
  "options": [
    { "text": "string", "is_correct": true, "order": 0 },
    { "text": "string", "is_correct": false, "order": 1 },
    { "text": "string", "is_correct": false, "order": 2 },
    { "text": "string", "is_correct": false, "order": 3 }
  ]
}
```

Notă: `id`-urile sunt generate de DB la salvare; frontend-ul deja lucrează cu `id?: number` pentru întrebări/opțiuni.

## Endpoint-uri backend (interne)
Recomandat (exemple de rute; ajustați după structura curentă):
- `POST /api/ai/quiz/description`
  - input: `{ title, goal, language? }`
  - output: `{ description }`
- `POST /api/ai/quiz/questions`
  - input: `{ title, goal, description?, language?, default_time_limit?, existing_questions? }`
  - output: `{ questions: QuestionCreate[] }` (exact 10, compatibil cu `QuizCreate.questions`)
- `POST /api/ai/quiz/questions/more`
  - input: `{ title, goal, description?, language?, default_time_limit?, existing_questions }`
  - output: `{ questions: QuestionCreate[] }` (exact 10, non-duplicate)
- `POST /api/ai/quiz/question/options/regenerate`
  - input: `{ title, goal, description?, language?, question_text, old_options }`
  - output: `{ options: AnswerOptionCreate[], explanation }` (opțiuni + corectul inclus în `is_correct`)

### Endpoint-uri existente (save/edit) – de folosit „ca atare”
- `POST /quizzes/` cu payload `QuizCreate` (salvare quiz nou)
- `PUT /quizzes/{quiz_id}` cu payload `QuizCreate` (edit quiz existent)

## Pregătire UI (Admin)
- În Dashboard există două intrări:
  - `New Quiz` (manual, existent)
  - `AI Quiz` → rută nouă: `/admin/create-ai` (scaffold / placeholder până la integrarea completă cu Alteus.ai)

## Prompturi pentru Alteus.ai (template-uri)
Aceste prompturi sunt gândite să fie trimise în payload-ul Alteus:
- `endpoint_id`: configurat în backend (din env / config)
- `input`: listă de mesaje cu `role` și `content` (`type: input_text`)
- `stream`: recomandat `false` la început (mai simplu), apoi `true` dacă vrem UX „live”

### Prompt 1: Generate description
**Input**: `title`, `goal`, `language` (opțional)  
**Output**: JSON strict: `{ "description": "..." }`

Text pentru `input_text`:
"""
You are a quiz authoring assistant. Output ONLY valid JSON. No markdown, no extra text.

Generate a concise quiz description for a quiz creation app.

Constraints:
- Language: {{language}} (default Romanian if not specified)
- Length: 1-2 sentences, max 120 characters, single line (no newline)
- Must align with the quiz goal
- Avoid fluff and generic marketing

Input:
Title: "{{title}}"
Goal: "{{goal}}"

Return EXACTLY this JSON shape:
{
  "description": "..."
}
"""

### Prompt 2: Generate 10 questions + options
**Input**: `title`, `goal`, `description` (opțional), `existing_questions` (pt. a evita duplicate)  
**Output**: JSON strict cu exact 10 întrebări.

Text pentru `input_text`:
"""
You are a quiz generator. Output ONLY valid JSON. No markdown, no commentary.

Create 10 high-quality multiple-choice questions for a quiz app.

Constraints:
- Language: {{language}} (default Romanian)
- Exactly 10 questions
- 4 options per question
- Exactly 1 correct option
- Provide a short explanation (1-3 short sentences)
- Keep questions and options VERY short for UI, especially TV layout:
  - question text max 90 characters
  - option text max 45 characters
  - explanation max 220 characters
- Avoid duplicates and near-duplicates with existing questions
- Options must be plausible (no obviously silly distractors)

Context:
Title: "{{title}}"
Goal: "{{goal}}"
Description (if any): "{{description}}"
Default time limit (seconds): {{default_time_limit}}

Existing questions (may be empty):
{{existing_questions_json_array}}

Return EXACTLY this JSON shape:
{
  "questions": [
    {
      "text": "...",
      "time_limit": {{default_time_limit}},
      "points": 1000,
      "order": 0,
      "question_type": "single",
      "options": [
        { "text": "...", "is_correct": true, "order": 0 },
        { "text": "...", "is_correct": false, "order": 1 },
        { "text": "...", "is_correct": false, "order": 2 },
        { "text": "...", "is_correct": false, "order": 3 }
      ],
      "explanation": "..."
    }
  ]
}
"""

### Prompt 3: Generate 10 more (continuare)
Identic cu Prompt 2, dar cu instrucțiunea explicită că sunt „additional” și fără repetări (și se trimit toate întrebările existente).

Text pentru `input_text`:
"""
You are a quiz generator. Output ONLY valid JSON. No markdown, no commentary.

Generate 10 additional multiple-choice questions that do NOT repeat or closely mimic the existing ones.

Constraints:
- Language: {{language}} (default Romanian)
- Exactly 10 new questions
- 4 options per question
- Exactly 1 correct option
- Provide a short explanation (1-3 short sentences)
- Keep questions and options VERY short for UI, especially TV layout:
  - question text max 90 characters
  - option text max 45 characters
  - explanation max 220 characters
- Must be different in angle and content from existing questions

Context:
Title: "{{title}}"
Goal: "{{goal}}"
Description (if any): "{{description}}"

Existing questions:
{{existing_questions_json_array}}

Return EXACTLY:
{
  "questions": [ ...10 items in the same schema as Prompt 2 (QuestionCreate-compatible)... ]
}
"""

### Prompt 4: Regenerate options for one question
**Input**: `question_text`, `old_options`, context (goal/description)  
**Output**: JSON strict cu opțiuni noi + corect + explicație.

Text pentru `input_text`:
"""
You are a quiz assistant. Output ONLY valid JSON. No markdown.

Regenerate ONLY the answer options for the given question. Keep the question text unchanged.

Constraints:
- Language: {{language}} (default Romanian)
- Provide 4 options
- Exactly 1 correct option
- Options must be plausible and close in difficulty
- Avoid reusing the old options
- Provide a short explanation consistent with the new correct option
- Keep options VERY short for TV layout (max 45 characters each)
- Keep explanation short (max 220 characters)

Context:
Goal: "{{goal}}"
Description (if any): "{{description}}"

Question (do not change):
"{{question_text}}"

Old options to avoid:
{{old_options_json_array}}

Return EXACTLY:
{
  "options": [
    { "text": "...", "is_correct": true, "order": 0 },
    { "text": "...", "is_correct": false, "order": 1 },
    { "text": "...", "is_correct": false, "order": 2 },
    { "text": "...", "is_correct": false, "order": 3 }
  ],
  "explanation": "..."
}
"""

## Notă despre „pagina veche”
După ce pagina **Create Quiz (AI)** este complet funcțională și stabilă, se poate elimina flow-ul vechi, dacă noul editor acoperă și:
- creare manuală
- creare cu AI
