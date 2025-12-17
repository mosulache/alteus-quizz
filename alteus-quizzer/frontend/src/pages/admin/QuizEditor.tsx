import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import { useQuizStore, type QuizCreate, type Question } from "@/store/quizStore";
import { useNavigate, useParams } from "react-router-dom";
import { useSettingsStore } from "@/store/settingsStore";
import { QUIZ_TEXT_LIMITS } from "@/lib/quizConstraints";

export function QuizEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { createQuiz, updateQuiz, getQuiz, isLoading } = useQuizStore();
    const { fetchSettings } = useSettingsStore();
    const isEditMode = !!id;
    
    const [title, setTitle] = useState("New Untitled Quiz");
    const [description, setDescription] = useState("");
    const [defaultTimer, setDefaultTimer] = useState(30);

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

    useEffect(() => {
        // Important: switching from /admin/edit/:id -> /admin/create can reuse the same component instance.
        // Without a reset, the local form state stays populated with the previous quiz data.
        if (!isEditMode) {
            setTitle("New Untitled Quiz");
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

    const handleSave = async () => {
        const quizData: QuizCreate = {
            title,
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
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{isEditMode ? "Edit Quiz" : "Create Quiz"}</h1>
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
                    <label className="text-sm font-medium text-slate-700">Description</label>
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
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Questions ({questions.length})</h2>
                    <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-2 border-dashed border-slate-300 hover:border-primary hover:text-primary">
                        <Plus size={16} /> Add Question
                    </Button>
                </div>

                {questions.map((q, i) => (
                    <Card key={i} className="group border-slate-200 hover:border-slate-300 transition-colors">
                        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                             <div className="mt-3 text-slate-300 cursor-move hover:text-slate-500 transition-colors">
                                <GripVertical size={20} />
                             </div>
                             <div className="flex-1 space-y-6">
                                <div className="flex gap-4">
                                    <Input 
                                        placeholder="Question text..." 
                                        value={q.text} 
                                        onChange={(e) => updateQuestion(i, 'text', e.target.value)}
                                        maxLength={QUIZ_TEXT_LIMITS.questionText}
                                        className="font-medium text-lg border-transparent px-0 hover:border-input focus:border-input transition-colors h-auto py-2" 
                                    />
                                    <div className="w-24">
                                        <Input 
                                            type="number" 
                                            value={q.time_limit}
                                            onChange={(e) => updateQuestion(i, 'time_limit', parseInt(e.target.value))}
                                            className="text-right" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    {q.options?.map((opt, oi) => (
                                        <div key={oi} className="flex gap-3 items-center group/opt">
                                            <div 
                                                className={`w-8 h-8 rounded-md border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${opt.is_correct ? 'bg-green-500 border-green-500 text-white shadow-sm' : 'border-slate-200 text-slate-400 bg-white hover:border-slate-400'}`}
                                                onClick={() => updateOption(i, oi, 'is_correct', !opt.is_correct)}
                                            >
                                                {String.fromCharCode(65 + oi)}
                                            </div>
                                            <Input 
                                                placeholder={`Option ${oi + 1}`} 
                                                value={opt.text}
                                                onChange={(e) => updateOption(i, oi, 'text', e.target.value)}
                                                maxLength={QUIZ_TEXT_LIMITS.optionText}
                                                className={`h-10 ${opt.is_correct ? 'font-medium text-green-700 bg-green-50 border-green-200 focus-visible:ring-green-500' : ''}`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Explanation (Optional)</label>
                                    <Textarea
                                        placeholder="Explain why the answer is correct..." 
                                        value={q.explanation || ""}
                                        onChange={(e) => updateQuestion(i, 'explanation', e.target.value)}
                                        maxLength={QUIZ_TEXT_LIMITS.explanation}
                                        rows={2}
                                        className="bg-slate-50/50 border-slate-200 focus:bg-white transition-colors resize-none" 
                                    />
                                    <div className="text-xs text-slate-400 text-right mt-1">
                                        {(q.explanation || "").length}/{QUIZ_TEXT_LIMITS.explanation}
                                    </div>
                                </div>
                             </div>
                             <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(i)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 -mt-2 -mr-2">
                                <Trash2 size={18} />
                             </Button>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
