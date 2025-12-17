import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QUIZ_TEXT_LIMITS } from "@/lib/quizConstraints";
import type { AnswerOption, Question } from "@/store/quizStore";
import { GripVertical, RefreshCcw, Trash2 } from "lucide-react";

type Props = {
  index: number;
  question: Partial<Question>;
  onChangeQuestion: (field: keyof Question, value: any) => void;
  onChangeOption: (optionIndex: number, field: keyof AnswerOption, value: any) => void;
  onRemove: () => void;
  onRegenerateOptions?: () => void;
  regenerateDisabled?: boolean;
};

export function QuestionEditorCard({
  index,
  question,
  onChangeQuestion,
  onChangeOption,
  onRemove,
  onRegenerateOptions,
  regenerateDisabled,
}: Props) {
  return (
    <Card className="group border-slate-200 hover:border-slate-300 transition-colors">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="mt-3 text-slate-300 cursor-move hover:text-slate-500 transition-colors">
          <GripVertical size={20} />
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex gap-4">
            <Input
              placeholder="Question text..."
              value={question.text || ""}
              onChange={(e) => onChangeQuestion("text", e.target.value)}
              maxLength={QUIZ_TEXT_LIMITS.questionText}
              className="font-medium text-lg border-transparent px-0 hover:border-input focus:border-input transition-colors h-auto py-2"
            />
            <div className="w-24">
              <Input
                type="number"
                value={question.time_limit ?? 30}
                onChange={(e) => onChangeQuestion("time_limit", parseInt(e.target.value || "0", 10))}
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-3">
            {(question.options || []).map((opt, oi) => (
              <div key={oi} className="flex gap-3 items-center group/opt">
                <div
                  className={`w-8 h-8 rounded-md border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${
                    opt.is_correct
                      ? "bg-green-500 border-green-500 text-white shadow-sm"
                      : "border-slate-200 text-slate-400 bg-white hover:border-slate-400"
                  }`}
                  onClick={() => onChangeOption(oi, "is_correct", !opt.is_correct)}
                  title="Mark as correct (single choice)"
                >
                  {String.fromCharCode(65 + oi)}
                </div>
                <Input
                  placeholder={`Option ${oi + 1}`}
                  value={opt.text || ""}
                  onChange={(e) => onChangeOption(oi, "text", e.target.value)}
                  maxLength={QUIZ_TEXT_LIMITS.optionText}
                  className={`h-10 ${
                    opt.is_correct
                      ? "font-medium text-green-700 bg-green-50 border-green-200 focus-visible:ring-green-500"
                      : ""
                  }`}
                />
              </div>
            ))}
          </div>

          {onRegenerateOptions && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRegenerateOptions}
                disabled={!!regenerateDisabled}
                className="gap-2"
              >
                <RefreshCcw size={14} /> Regenerate options
              </Button>
              <span className="text-xs text-slate-400">Keeps question text; regenerates options + explanation.</span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">
              Explanation (Optional)
            </label>
            <Textarea
              placeholder="Explain why the answer is correct..."
              value={question.explanation || ""}
              onChange={(e) => onChangeQuestion("explanation", e.target.value)}
              maxLength={QUIZ_TEXT_LIMITS.explanation}
              rows={2}
              className="bg-slate-50/50 border-slate-200 focus:bg-white transition-colors resize-none"
            />
            <div className="text-xs text-slate-400 text-right mt-1">
              {(question.explanation || "").length}/{QUIZ_TEXT_LIMITS.explanation}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-xs text-slate-400 font-medium">#{index + 1}</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-slate-300 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}


