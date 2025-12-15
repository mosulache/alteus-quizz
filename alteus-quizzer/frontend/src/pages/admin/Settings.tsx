import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Save, RefreshCw } from "lucide-react";

export function Settings() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">Settings</h1>

            <div className="grid gap-8">
                {/* Gameplay Defaults */}
                <Card>
                    <CardHeader>
                        <CardTitle>Gameplay Defaults</CardTitle>
                        <CardDescription>Set default values for new quizzes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Default Timer (seconds)</label>
                                <Input type="number" defaultValue="30" />
                                <p className="text-xs text-slate-500">Time given to answer each question.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Points System</label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                    <option value="standard">Standard (1000 pts + Speed Bonus)</option>
                                    <option value="simple">Simple (1 pt per correct answer)</option>
                                    <option value="no_points">No Points (Survey Mode)</option>
                                </select>
                                <p className="text-xs text-slate-500">How points are calculated for players.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Session Defaults */}
                <Card>
                    <CardHeader>
                        <CardTitle>Session Configuration</CardTitle>
                        <CardDescription>Default settings for new game sessions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium text-slate-900 block">Enable Test Mode</label>
                                <span className="text-xs text-slate-500">Allows players to flag questions for "Rework" or "Exclude".</span>
                            </div>
                            <div className="flex items-center h-5">
                                <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                            </div>
                        </div>

                         <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium text-slate-900 block">Require Player Names</label>
                                <span className="text-xs text-slate-500">If disabled, players will be assigned random fun names.</span>
                            </div>
                            <div className="flex items-center h-5">
                                <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                            </div>
                        </div>

                         <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium text-slate-700">Leaderboard Frequency</label>
                             <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="every_round">Show after every question</option>
                                <option value="end_only">Show only at the end</option>
                                <option value="top_3">Show Top 3 after every question</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                 {/* System */}
                <Card>
                    <CardHeader>
                        <CardTitle>System & Branding</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Organization Name</label>
                            <Input defaultValue="Alteus.ai" />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 border-t flex justify-end p-4">
                         <Button variant="destructive" size="sm" className="gap-2">
                            <RefreshCw size={14} /> Reset to Defaults
                         </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="flex justify-end gap-4 py-6">
                <Button variant="outline">Discard Changes</Button>
                <Button className="gap-2 min-w-[120px]">
                    <Save size={16} /> Save Settings
                </Button>
            </div>
        </div>
    )
}

