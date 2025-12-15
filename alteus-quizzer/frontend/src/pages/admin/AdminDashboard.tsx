import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Play, Edit, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminDashboard() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <Link to="/admin/create">
                    <Button className="gap-2 shadow-sm"><Plus size={16}/> New Quiz</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow group cursor-pointer border-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="group-hover:text-primary transition-colors">AI Fundamentals {i}</CardTitle>
                            <CardDescription>Created on Dec {10+i}, 2024</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">15 Questions</span>
                                <span className="text-slate-300">•</span>
                                <span>45 mins</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0">
                            <Button variant="outline" size="sm" className="gap-2 border-slate-200 hover:bg-slate-50">
                                <Edit size={14} /> Edit
                            </Button>
                            <Button size="sm" className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                                <Play size={14} /> Host
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

