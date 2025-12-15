import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Play, Edit, Plus, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuizStore } from "@/store/quizStore";
import { useGameStore } from "@/store/gameStore";

export function AdminDashboard() {
    const { quizzes, fetchQuizzes, isLoading, createSession } = useQuizStore();
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

    if (isLoading && quizzes.length === 0) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <Link to="/admin/create">
                    <Button className="gap-2 shadow-sm"><Plus size={16}/> New Quiz</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                    <Card key={quiz.id} className="hover:shadow-md transition-shadow group cursor-pointer border-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="group-hover:text-primary transition-colors">{quiz.title}</CardTitle>
                            <CardDescription>Created on {new Date(quiz.created_at).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">{quiz.questions?.length || 0} Questions</span>
                                <span className="text-slate-300">•</span>
                                <span>{quiz.default_time_limit}s / q</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{quiz.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0">
                            <Link to={`/admin/edit/${quiz.id}`}>
                                <Button variant="outline" size="sm" className="gap-2 border-slate-200 hover:bg-slate-50">
                                    <Edit size={14} /> Edit
                                </Button>
                            </Link>
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
                {!isLoading && quizzes.length === 0 && (
                     <div className="col-span-full text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 mb-4">No quizzes found.</p>
                        <Link to="/admin/create">
                            <Button variant="outline">Create your first Quiz</Button>
                        </Link>
                     </div>
                )}
            </div>
        </div>
    )
}
