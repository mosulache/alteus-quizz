import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QUIZ_TEXT_LIMITS } from "@/lib/quizConstraints";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function CreateQuizAI() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");

  const canGenerate = useMemo(() => title.trim().length > 0 && goal.trim().length > 0, [title, goal]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 py-4 z-10 border-b border-transparent">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Sparkles className="text-primary" size={22} /> Create Quiz (AI)
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
          <Button disabled title="Coming soon: AI-generated quiz saving will be wired next.">
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
          <Input
            placeholder="What is this quiz for?"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={QUIZ_TEXT_LIMITS.description}
          />
          <div className="text-xs text-slate-400 text-right">
            {goal.length}/{QUIZ_TEXT_LIMITS.description}
          </div>
          <p className="text-xs text-slate-400">
            Goal is used only to guide AI generation. It is not persisted in the current backend schema.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canGenerate}
              title="Coming soon: will call backend AI endpoint to generate description."
            >
              Generate description
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
          <Button
            type="button"
            variant="outline"
            disabled={!canGenerate}
            title="Coming soon: will call backend AI endpoint to generate 10 questions."
          >
            Generate questions and options
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            title="Coming soon"
          >
            Generate 10 more
          </Button>
        </div>

        <div className="text-xs text-slate-400 pt-2">
          Note: This page is a scaffold. Next step will wire Alteus.ai via backend-only endpoints.
        </div>
      </div>
    </div>
  );
}


