import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

export function QuizEditor() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 py-4 z-10 border-b border-transparent">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Quiz</h1>
                <div className="flex gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Quiz</Button>
                </div>
            </div>

            <div className="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Quiz Title</label>
                    <Input placeholder="Enter quiz title" defaultValue="New Untitled Quiz" className="text-lg font-medium" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <Input placeholder="Short description..." className="text-slate-500" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Questions</h2>
                    <Button variant="outline" size="sm" className="gap-2 border-dashed border-slate-300 hover:border-primary hover:text-primary">
                        <Plus size={16} /> Add Question
                    </Button>
                </div>

                {[1, 2].map((i) => (
                    <Card key={i} className="group border-slate-200 hover:border-slate-300 transition-colors">
                        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                             <div className="mt-3 text-slate-300 cursor-move hover:text-slate-500 transition-colors">
                                <GripVertical size={20} />
                             </div>
                             <div className="flex-1 space-y-6">
                                <div className="flex gap-4">
                                    <Input placeholder="Question text..." defaultValue={`Question ${i}`} className="font-medium text-lg border-transparent px-0 hover:border-input focus:border-input transition-colors h-auto py-2" />
                                    <div className="w-24">
                                        <Input type="number" defaultValue="30" className="text-right" />
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex gap-3 items-center group/opt">
                                        <div className="w-8 h-8 rounded-md border-2 border-slate-200 flex items-center justify-center text-sm font-bold text-slate-400 group-hover/opt:border-slate-400 cursor-pointer transition-colors bg-white">A</div>
                                        <Input placeholder="Option 1" className="h-10" />
                                    </div>
                                    <div className="flex gap-3 items-center group/opt">
                                        <div className="w-8 h-8 rounded-md border-2 border-green-500 bg-green-500 flex items-center justify-center text-sm font-bold text-white cursor-pointer shadow-sm transition-transform hover:scale-105">B</div>
                                        <Input placeholder="Option 2 (Correct)" defaultValue="Correct Answer" className="h-10 font-medium text-green-700 bg-green-50 border-green-200 focus-visible:ring-green-500" />
                                    </div>
                                    <div className="flex gap-3 items-center group/opt">
                                        <div className="w-8 h-8 rounded-md border-2 border-slate-200 flex items-center justify-center text-sm font-bold text-slate-400 group-hover/opt:border-slate-400 cursor-pointer transition-colors bg-white">C</div>
                                        <Input placeholder="Option 3" className="h-10" />
                                    </div>
                                    <div className="flex gap-3 items-center group/opt">
                                        <div className="w-8 h-8 rounded-md border-2 border-slate-200 flex items-center justify-center text-sm font-bold text-slate-400 group-hover/opt:border-slate-400 cursor-pointer transition-colors bg-white">D</div>
                                        <Input placeholder="Option 4" className="h-10" />
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Explanation (Optional)</label>
                                    <Input placeholder="Explain why the answer is correct... (shown after timer ends)" className="bg-slate-50/50 border-slate-200 focus:bg-white transition-colors" />
                                </div>
                             </div>
                             <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 hover:bg-red-50 -mt-2 -mr-2">
                                <Trash2 size={18} />
                             </Button>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
