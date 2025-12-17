import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Save, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export function Settings() {
    const { fetchSettings, saveSettings, isLoading, isSaving, error } = useSettingsStore();

    const defaults = useMemo(() => ({
        default_timer_seconds: 30,
        points_system: "standard",
        leaderboard_frequency: "every_round",
        enable_test_mode: true,
        require_player_names: true,
        organization_name: "Alteus.ai",
    }), []);

    const [form, setForm] = useState(defaults);
    const [loadedSnapshot, setLoadedSnapshot] = useState<typeof defaults | null>(null);

    useEffect(() => {
        fetchSettings().then((s) => {
            if (!s) return;
            const next = {
                default_timer_seconds: s.default_timer_seconds,
                points_system: s.points_system,
                leaderboard_frequency: s.leaderboard_frequency,
                enable_test_mode: s.enable_test_mode,
                require_player_names: s.require_player_names,
                organization_name: s.organization_name,
            };
            setForm(next);
            setLoadedSnapshot(next);
        });
    }, [fetchSettings]);

    const hasChanges = !!loadedSnapshot && JSON.stringify(form) !== JSON.stringify(loadedSnapshot);

    const onSave = async () => {
        await saveSettings(form as any);
        setLoadedSnapshot(form);
    };

    const onDiscard = () => {
        if (loadedSnapshot) setForm(loadedSnapshot);
    };

    const onReset = async () => {
        setForm(defaults);
        await saveSettings(defaults as any);
        setLoadedSnapshot(defaults);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">Settings</h1>

            {error && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50">
                    <p className="text-sm font-medium text-red-800">Eroare</p>
                    <p className="text-xs text-red-700 mt-1 break-words">{error}</p>
                </div>
            )}

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
                                <Input
                                    type="number"
                                    value={form.default_timer_seconds}
                                    disabled={isLoading}
                                    onChange={(e) => setForm((p) => ({ ...p, default_timer_seconds: Math.max(1, parseInt(e.target.value || "0", 10) || 0) }))}
                                />
                                <p className="text-xs text-slate-500">Time given to answer each question.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Points System</label>
                                <select
                                    value={form.points_system}
                                    disabled={isLoading}
                                    onChange={(e) => setForm((p) => ({ ...p, points_system: e.target.value }))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
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
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={form.enable_test_mode}
                                    disabled={isLoading}
                                    onChange={(e) => setForm((p) => ({ ...p, enable_test_mode: e.target.checked }))}
                                />
                            </div>
                        </div>

                         <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium text-slate-900 block">Require Player Names</label>
                                <span className="text-xs text-slate-500">If disabled, players will be assigned random fun names.</span>
                            </div>
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={form.require_player_names}
                                    disabled={isLoading}
                                    onChange={(e) => setForm((p) => ({ ...p, require_player_names: e.target.checked }))}
                                />
                            </div>
                        </div>

                         <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium text-slate-700">Leaderboard Frequency</label>
                             <select
                                value={form.leaderboard_frequency}
                                disabled={isLoading}
                                onChange={(e) => setForm((p) => ({ ...p, leaderboard_frequency: e.target.value }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                             >
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
                            <Input
                                value={form.organization_name}
                                disabled={isLoading}
                                onChange={(e) => setForm((p) => ({ ...p, organization_name: e.target.value }))}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 border-t flex justify-end p-4">
                         <Button variant="destructive" size="sm" className="gap-2" onClick={onReset} disabled={isLoading || isSaving}>
                            <RefreshCw size={14} /> Reset to Defaults
                         </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="flex justify-end gap-4 py-6">
                <Button variant="outline" onClick={onDiscard} disabled={!hasChanges || isLoading || isSaving}>Discard Changes</Button>
                <Button className="gap-2 min-w-[120px]" onClick={onSave} disabled={!hasChanges || isLoading || isSaving}>
                    <Save size={16} /> Save Settings
                </Button>
            </div>
        </div>
    )
}

