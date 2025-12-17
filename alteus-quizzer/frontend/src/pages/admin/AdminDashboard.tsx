import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Play, Edit, Plus, Loader2, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuizStore } from "@/store/quizStore";
import { useGameStore } from "@/store/gameStore";

export function AdminDashboard() {
    const { quizzes, fetchQuizzes, isLoading, createSession, deleteQuiz, error } = useQuizStore();
    const { connect } = useGameStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const handleHost = async (quizId: number) => {
        try {
            const code = await createSession(quizId);
            connect("Host", code, true);
            navigate("/host");
        } catch (error) {
            console.error("Failed to start session:", error);
            alert("Failed to start session. Check console.");
        }
    };

    const handleDelete = async (quizId: number, title?: string) => {
        const ok = window.confirm(`Delete quiz "${title || `#${quizId}`}"?\n\nThis will remove the quiz, all questions/options, and all sessions/participants.`);
        if (!ok) return;
        try {
            await deleteQuiz(quizId);
        } catch (error) {
            console.error("Failed to delete quiz:", error);
            alert("Failed to delete quiz. Check console.");
        }
    };

    if (isLoading && quizzes.length === 0) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <div className="flex gap-2">
                    <Link to="/admin/create-ai">
                        <Button className="gap-2 shadow-sm"><Plus size={16}/> New Quiz</Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]">
                {quizzes.map((quiz) => (
                    <Card
                        key={quiz.id}
                        className="hover:shadow-md transition-shadow group cursor-pointer border-slate-200 flex flex-col h-60"
                    >
                        <CardHeader className="pb-3">
                            <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">{quiz.title}</CardTitle>
                            <CardDescription>Created on {new Date(quiz.created_at).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 overflow-hidden">
                            <div className="text-sm text-slate-500 flex items-center gap-2 flex-nowrap">
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">{quiz.questions?.length || 0} Questions</span>
                                <span className="text-slate-300">•</span>
                                <span>{quiz.default_time_limit}s / q</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{quiz.description}</p>
                        </CardContent>
                        <CardFooter className="mt-auto flex justify-between pt-0">
                            <Link to={`/admin/edit/${quiz.id}`}>
                                <Button variant="outline" size="sm" className="gap-2 border-slate-200 hover:bg-slate-50">
                                    <Edit size={14} /> Edit
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                                disabled={isLoading}
                                onClick={() => handleDelete(quiz.id, quiz.title)}
                            >
                                <Trash2 size={14} /> Delete
                            </Button>
                            <Button 
                                size="sm" 
                                className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
                                onClick={() => handleHost(quiz.id)}
                            >
                                <Play size={14} /> Host
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {error && (
                    <div className="col-span-full p-4 rounded-xl border border-red-200 bg-red-50">
                        <p className="text-sm font-medium text-red-800">Eroare la încărcarea quiz-urilor</p>
                        <p className="text-xs text-red-700 mt-1 break-words">{error}</p>
                        <p className="text-xs text-red-700 mt-2">
                            Dacă ai deschis frontend-ul pe IP (ex. <span className="font-mono">192.168.x.x</span>), asigură-te că backend-ul ascultă pe rețea (ex. <span className="font-mono">uvicorn ... --host 0.0.0.0</span>) sau setează <span className="font-mono">VITE_API_URL</span>.
                        </p>
                    </div>
                )}
                {!isLoading && quizzes.length === 0 && (
                     <div className="col-span-full text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 mb-4">No quizzes found.</p>
                        <Link to="/admin/create-ai">
                            <Button variant="outline">Create your first Quiz</Button>
                        </Link>
                     </div>
                )}
            </div>
        </div>
    )
}
