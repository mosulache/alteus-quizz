import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QUIZ_TEXT_LIMITS } from "@/lib/quizConstraints";
import { Plus, Save, Loader2, Sparkles } from "lucide-react";
import { useQuizStore, type QuizCreate, type Question } from "@/store/quizStore";
import { useNavigate, useParams } from "react-router-dom";
import { useSettingsStore } from "@/store/settingsStore";
import { QuestionEditorCard } from "@/components/admin/QuestionEditorCard";
import { apiRequest } from "@/lib/api";

export function QuizEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { createQuiz, updateQuiz, getQuiz, isLoading } = useQuizStore();
    const { fetchSettings } = useSettingsStore();
    const isEditMode = !!id;
    
    const [title, setTitle] = useState("New Untitled Quiz");
    const [goal, setGoal] = useState("");
    const [description, setDescription] = useState("");
    const [defaultTimer, setDefaultTimer] = useState(30);
    const [generateCount, setGenerateCount] = useState<number>(10);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [isGeneratingMore, setIsGeneratingMore] = useState(false);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

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

    const [questions, setQuestions] = useState<Partial<Question>[]>([
        makeDefaultQuestion(1, 30),
    ]);

    const canGenerateAI = useMemo(() => title.trim().length > 0 && goal.trim().length > 0, [title, goal]);
    const normalizedCount = useMemo(() => {
        const n = Number.isFinite(generateCount) ? Math.floor(generateCount) : 10;
        return Math.max(1, Math.min(50, n || 10));
    }, [generateCount]);

    const existingQuestionTexts = useMemo(
        () => questions.map((q) => (q.text || "").trim()).filter(Boolean),
        [questions]
    );

    useEffect(() => {
        // Important: switching from /admin/edit/:id -> /admin/create can reuse the same component instance.
        // Without a reset, the local form state stays populated with the previous quiz data.
        if (!isEditMode) {
            setTitle("New Untitled Quiz");
            setGoal("");
            setDescription("");
            setDefaultTimer(30);
            setQuestions([makeDefaultQuestion(1, 30)]);
        }
    }, [isEditMode]);

    useEffect(() => {
        if (isEditMode && id) {
            getQuiz(parseInt(id)).then(quiz => {
                if (quiz) {
                    setTitle(quiz.title);
                    setGoal(quiz.goal || "");
                    setDescription(quiz.description || "");
                    setDefaultTimer(quiz.default_time_limit || 30);
                    setQuestions(quiz.questions);
                }
            });
        }
    }, [id, isEditMode, getQuiz]);

    useEffect(() => {
        // For new quizzes, seed defaults from Admin Settings
        if (!isEditMode) {
            fetchSettings().then((s) => {
                const timer = s?.default_timer_seconds || 30;
                setDefaultTimer(timer);
                setQuestions((prev) => {
                    // Only auto-apply if the initial state is still untouched "30"
                    if (prev.length === 1 && (prev[0].time_limit ?? 30) === 30) {
                        const next = [...prev];
                        next[0] = { ...next[0], time_limit: timer };
                        return next;
                    }
                    return prev;
                });
            });
        }
    }, [fetchSettings, isEditMode]);

    const handleAddQuestion = () => {
        setQuestions([...questions, makeDefaultQuestion(questions.length + 1, defaultTimer)]);
    };

    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, field: string, value: any) => {
        const newQuestions = [...questions];
        const options = [...(newQuestions[qIndex].options || [])];
        options[oIndex] = { ...options[oIndex], [field]: value };
        
        // If setting is_correct, uncheck others for single choice logic (optional UI polish)
        if (field === 'is_correct' && value === true) {
             options.forEach((o, i) => {
                 if (i !== oIndex) o.is_correct = false;
             });
        }
        
        newQuestions[qIndex] = { ...newQuestions[qIndex], options };
        setQuestions(newQuestions);
    };

    const handleGenerateDescription = async () => {
        if (!canGenerateAI) return;
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

    const handleGenerateMore = async () => {
        if (!canGenerateAI) return;
        setIsGeneratingMore(true);
        try {
            const res = await apiRequest<{ questions: Question[] }>("/api/ai/quiz/questions/more", {
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
                const start = prev.length;
                const appended = (res.questions || []).map((q, i) => ({
                    ...q,
                    order: start + i,
                    time_limit: q.time_limit ?? defaultTimer,
                    points: q.points ?? 1000,
                    question_type: q.question_type || "single",
                    options: (q.options || []).map((o, oi) => ({ ...o, order: oi })),
                }));
                return [...prev, ...appended];
            });
        } catch (e: any) {
            alert(e.message || "Failed to generate more questions");
        } finally {
            setIsGeneratingMore(false);
        }
    };

    const handleRegenerateOptions = async (qIndex: number) => {
        if (!canGenerateAI) return;
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
        const quizData: QuizCreate = {
            title,
            goal,
            description,
            default_time_limit: defaultTimer,
            questions: questions.map((q, i) => ({
                text: q.text || "Untitled Question",
                time_limit: q.time_limit || defaultTimer,
                points: q.points || 1000,
                order: i,
                explanation: q.explanation || "",
                question_type: "single", // Hardcoded for now
                options: (q.options || []).map((o, oi) => ({
                    text: o.text || `Option ${oi + 1}`,
                    is_correct: o.is_correct || false,
                    order: oi
                }))
            }))
        };
        
        // Basic Validation
        if (!quizData.title) return alert("Title is required");
        if (quizData.questions.length === 0) return alert("Add at least one question");

        if (isEditMode && id) {
            await updateQuiz(parseInt(id), quizData);
        } else {
            await createQuiz(quizData);
        }
        navigate("/admin");
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 py-4 z-10 border-b border-transparent">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Sparkles className="text-primary" size={22} /> {isEditMode ? "Edit Quiz" : "Create Quiz"}
                </h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>}
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
                            disabled={!canGenerateAI || isGeneratingDescription}
                            onClick={handleGenerateDescription}
                            className="gap-2"
                            title={!canGenerateAI ? "Fill Title + Goal to use AI" : undefined}
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

                {isEditMode && (
                    <div className="pt-2 flex flex-wrap gap-2 items-center">
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
                            disabled={!canGenerateAI || isGeneratingMore}
                            onClick={handleGenerateMore}
                            className="gap-2"
                            title={!canGenerateAI ? "Fill Title + Goal to use AI" : undefined}
                        >
                            <Sparkles size={14} /> Generate more questions
                        </Button>
                        {!canGenerateAI && (
                            <div className="text-xs text-slate-400">
                                AI needs Title + Goal.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Questions ({questions.length})</h2>
                    <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-2 border-dashed border-slate-300 hover:border-primary hover:text-primary">
                        <Plus size={16} /> Add Question
                    </Button>
                </div>

                {questions.map((q, i) => (
                    <QuestionEditorCard
                        key={i}
                        index={i}
                        question={q}
                        onChangeQuestion={(field, value) => updateQuestion(i, field, value)}
                        onChangeOption={(oi, field, value) => updateOption(i, oi, field, value)}
                        onRemove={() => handleRemoveQuestion(i)}
                        onRegenerateOptions={isEditMode ? () => handleRegenerateOptions(i) : undefined}
                        regenerateDisabled={regeneratingIndex === i}
                    />
                ))}
            </div>
        </div>
    )
}
