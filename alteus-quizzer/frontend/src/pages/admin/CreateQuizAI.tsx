import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QUIZ_TEXT_LIMITS } from "@/lib/quizConstraints";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useQuizStore, type QuizCreate, type Question } from "@/store/quizStore";
import { useSettingsStore } from "@/store/settingsStore";
import { QuestionEditorCard } from "@/components/admin/QuestionEditorCard";

export function CreateQuizAI() {
  const navigate = useNavigate();
  const { createQuiz, isLoading: isSaving } = useQuizStore();
  const { fetchSettings } = useSettingsStore();

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [defaultTimer, setDefaultTimer] = useState(30);
  const [questions, setQuestions] = useState<Partial<Question>[]>([]);
  const [generateCount, setGenerateCount] = useState<number>(10);

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const canGenerate = useMemo(() => title.trim().length > 0 && goal.trim().length > 0, [title, goal]);
  const canSave = useMemo(() => title.trim().length > 0 && questions.length > 0, [title, questions.length]);

  useEffect(() => {
    fetchSettings().then((s) => {
      const timer = s?.default_timer_seconds || 30;
      setDefaultTimer(timer);
      setQuestions((prev) =>
        prev.map((q) => ({
          ...q,
          time_limit: q.time_limit ?? timer,
        }))
      );
    });
  }, [fetchSettings]);

  const existingQuestionTexts = useMemo(
    () => questions.map((q) => (q.text || "").trim()).filter(Boolean),
    [questions]
  );

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const next = [...questions];
    next[index] = { ...next[index], [field]: value };
    setQuestions(next);
  };

  const updateOption = (qIndex: number, oIndex: number, field: any, value: any) => {
    const next = [...questions];
    const options = [...(next[qIndex].options || [])];
    options[oIndex] = { ...options[oIndex], [field]: value };
    if (field === "is_correct" && value === true) {
      options.forEach((o, i) => {
        if (i !== oIndex) (o as any).is_correct = false;
      });
    }
    next[qIndex] = { ...next[qIndex], options };
    setQuestions(next);
  };

  const removeQuestion = (index: number) => {
    const next = [...questions];
    next.splice(index, 1);
    setQuestions(next.map((q, i) => ({ ...q, order: i })));
  };

  const makeDefaultQuestion = (index: number, timerSeconds: number): Partial<Question> => ({
    text: `Question ${index}`,
    time_limit: timerSeconds,
    points: 1000,
    question_type: "single",
    options: [
      { text: "", is_correct: false, order: 0 },
      { text: "", is_correct: false, order: 1 },
      { text: "", is_correct: false, order: 2 },
      { text: "", is_correct: false, order: 3 },
    ],
  });

  const handleAddQuestion = () => {
    setQuestions((prev) => {
      const next = [...prev, makeDefaultQuestion(prev.length + 1, defaultTimer)];
      return next.map((q, i) => ({ ...q, order: i }));
    });
  };

  const normalizedCount = useMemo(() => {
    const n = Number.isFinite(generateCount) ? Math.floor(generateCount) : 10;
    return Math.max(1, Math.min(50, n || 10));
  }, [generateCount]);

  const handleGenerateDescription = async () => {
    if (!canGenerate) return;
    setIsGeneratingDescription(true);
    try {
      const res = await apiRequest<{ description: string }>("/api/ai/quiz/description", {
        method: "POST",
        body: JSON.stringify({ title, goal }),
      });
      setDescription(res.description || "");
    } catch (e: any) {
      alert(e.message || "Failed to generate description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!canGenerate) return;
    setIsGeneratingQuestions(true);
    try {
      const shouldAppend = questions.length > 0;
      const endpoint = shouldAppend ? "/api/ai/quiz/questions/more" : "/api/ai/quiz/questions";

      const res = await apiRequest<{ questions: Question[] }>(endpoint, {
        method: "POST",
        body: JSON.stringify({
          title,
          goal,
          description,
          default_time_limit: defaultTimer,
          existing_questions: existingQuestionTexts,
          count: normalizedCount,
        }),
      });
      setQuestions((prev) => {
        const start = shouldAppend ? prev.length : 0;
        const normalized = (res.questions || []).map((q, i) => ({
          ...q,
          order: start + i,
          time_limit: q.time_limit ?? defaultTimer,
          points: q.points ?? 1000,
          question_type: q.question_type || "single",
          options: (q.options || []).map((o, oi) => ({ ...o, order: oi })),
        }));

        const next = shouldAppend ? [...prev, ...normalized] : normalized;
        return next.map((q, i) => ({ ...q, order: i }));
      });
    } catch (e: any) {
      alert(e.message || "Failed to generate questions");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleRegenerateOptions = async (qIndex: number) => {
    if (!canGenerate) return;
    const q = questions[qIndex];
    const question_text = (q.text || "").trim();
    if (!question_text) return alert("Question text is required to regenerate options.");

    setRegeneratingIndex(qIndex);
    try {
      const oldOptions = (q.options || []).map((o) => o.text || "").filter(Boolean);
      const res = await apiRequest<{ options: any[]; explanation: string }>("/api/ai/quiz/question/options/regenerate", {
        method: "POST",
        body: JSON.stringify({
          title,
          goal,
          description,
          question_text,
          old_options: oldOptions,
        }),
      });
      setQuestions((prev) => {
        const next = [...prev];
        const existing = next[qIndex] || {};
        next[qIndex] = {
          ...existing,
          options: (res.options || []).map((o, oi) => ({ ...o, order: oi })),
          explanation: res.explanation || existing.explanation || "",
        };
        return next;
      });
    } catch (e: any) {
      alert(e.message || "Failed to regenerate options");
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    const quizData: QuizCreate = {
      title,
      goal,
      description,
      default_time_limit: defaultTimer,
      questions: questions.map((q, i) => ({
        text: q.text || `Question ${i + 1}`,
        time_limit: q.time_limit || defaultTimer,
        points: q.points || 1000,
        order: i,
        explanation: q.explanation || "",
        question_type: "single",
        options: (q.options || []).map((o, oi) => ({
          text: o.text || `Option ${oi + 1}`,
          is_correct: !!o.is_correct,
          order: oi,
        })),
      })),
    };

    try {
      await createQuiz(quizData);
      navigate("/admin");
    } catch (e: any) {
      alert(e.message || "Failed to save quiz");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 py-4 z-10 border-b border-transparent">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Sparkles className="text-primary" size={22} /> Create Quiz
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            Save Quiz
          </Button>
        </div>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Quiz Title</label>
          <Input
            placeholder="Enter quiz title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={QUIZ_TEXT_LIMITS.title}
            className="text-lg font-medium"
          />
          <div className="text-xs text-slate-400 text-right">
            {title.length}/{QUIZ_TEXT_LIMITS.title}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Goal / Purpose</label>
          <Textarea
            placeholder="What is this quiz for?"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={QUIZ_TEXT_LIMITS.goal}
            rows={4}
            className="text-slate-600 resize-y"
          />
          <div className="text-xs text-slate-400 text-right">
            {goal.length}/{QUIZ_TEXT_LIMITS.goal}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGenerate || isGeneratingDescription}
              onClick={handleGenerateDescription}
              className="gap-2"
            >
              <Sparkles size={14} /> Generate description
            </Button>
          </div>
          <Textarea
            placeholder="Short description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={QUIZ_TEXT_LIMITS.description}
            rows={2}
            className="text-slate-600 resize-none"
          />
          <div className="text-xs text-slate-400 text-right">
            {description.length}/{QUIZ_TEXT_LIMITS.description}
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Count</label>
            <Input
              type="number"
              value={generateCount}
              onChange={(e) => setGenerateCount(parseInt(e.target.value || "10", 10))}
              min={1}
              max={50}
              className="w-24"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!canGenerate || isGeneratingQuestions}
            onClick={handleGenerateQuestions}
            className="gap-2"
          >
            <Sparkles size={14} /> Generate questions and options
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddQuestion}
            className="gap-2 border-dashed border-slate-300 hover:border-primary hover:text-primary"
          >
            <Plus size={16} /> Add Question
          </Button>
        </div>

        <div className="text-xs text-slate-400 pt-2">
          AI calls are backend-only. UI shows a spinner while generation runs.
        </div>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Questions ({questions.length})</h2>
          </div>

          {questions.map((q, i) => (
            <QuestionEditorCard
              key={i}
              index={i}
              question={q}
              onChangeQuestion={(field, value) => updateQuestion(i, field, value)}
              onChangeOption={(oi, field, value) => updateOption(i, oi, field, value)}
              onRemove={() => removeQuestion(i)}
              onRegenerateOptions={() => handleRegenerateOptions(i)}
              regenerateDisabled={regeneratingIndex === i}
            />
          ))}
        </div>
      )}
    </div>
  );
}


