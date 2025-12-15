import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function Game() {
  const { quiz, currentQuestionIndex, submitAnswer, lastAnswerId, status, currentPlayer, currentQuestion, timeRemaining } = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'WAITING') {
      navigate('/lobby');
    }
  }, [status, navigate]);

  const question = currentQuestion;

  useEffect(() => {
    // Force scroll to top and blur active element when question changes
    if (question?.id) {
        window.scrollTo(0, 0);
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }
  }, [question?.id]);

  if (!question) {
      return (
          <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
      );
  }

  const totalQuestions = quiz?.totalQuestions || 0;
  
  if (status === 'FINISHED') {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in zoom-in">
              <h1 className="text-4xl font-bold text-primary">Quiz Finished!</h1>
              <div className="text-8xl animate-bounce">🏆</div>
              <div className="space-y-2">
                <p className="text-xl font-medium text-slate-600">Thanks for playing</p>
                <p className="text-3xl font-bold text-slate-900">{currentPlayer?.name}</p>
              </div>
              <Button size="lg" className="mt-8" onClick={() => navigate('/lobby')}>Back to Lobby</Button>
          </div>
      )
  }

  if (status === 'REVIEW') {
      const options = question?.options || []; // Guard against undefined options
      const isCorrect = lastAnswerId 
        ? options.find(o => o.id === lastAnswerId)?.isCorrect 
        : false;
      const correctOption = options.find(o => o.isCorrect);

      return (
        <div className="flex flex-col h-full gap-4 animate-in slide-in-from-right duration-300">
            <div className={cn(
                "p-8 rounded-2xl text-center flex flex-col items-center gap-4 text-white shadow-lg transition-colors",
                isCorrect ? "bg-green-500 shadow-green-200" : "bg-red-500 shadow-red-200"
            )}>
                {isCorrect ? <CheckCircle2 size={64} className="animate-bounce" /> : <XCircle size={64} className="animate-shake" />}
                <h2 className="text-3xl font-bold">{isCorrect ? "Correct!" : "Wrong!"}</h2>
                <div className="text-lg font-medium opacity-90 bg-white/20 px-4 py-1 rounded-full">
                    {isCorrect ? "+100 Points" : "Better luck next time"}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-2">
                {!isCorrect && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                        <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Correct Answer</p>
                        <p className="text-green-800 font-bold text-lg leading-tight">{correctOption?.text}</p>
                    </div>
                )}
                
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <p className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <span>💡</span> Explanation
                    </p>
                    <p className="text-slate-600 leading-relaxed text-sm">{question.explanation}</p>
                </div>

                {/* TEST MODE MOCK */}
                <div className="border-t border-slate-100 pt-4 mt-4">
                    <p className="text-[10px] text-slate-400 font-mono mb-3 text-center uppercase tracking-widest">Test Mode Feedback</p>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="flex-1 gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 h-10">
                            <AlertTriangle size={16} /> Rework
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-10">
                            <XCircle size={16} /> Exclude
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="text-center text-sm text-slate-400 py-2 animate-pulse">
                Waiting for next question...
            </div>
        </div>
      );
  }

  // ACTIVE STATE
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
        <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-slate-400 uppercase">Time</span>
             <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                {timeRemaining}
             </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-8 leading-snug">
        {question.text}
      </h2>

      <div className="grid grid-cols-1 gap-3 flex-1 content-start" key={question.id}>
        {question.options?.map((option, idx) => {
            // Robust check: Ensure lastAnswerId is actually valid for this question
            // If the preserved ID doesn't exist in current options, ignore it
            const isValidAnswer = lastAnswerId && question.options?.some(o => o.id === lastAnswerId);
            const isSelected = isValidAnswer && lastAnswerId === option.id;

            return (
            <Button
                key={option.id}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                    "h-auto py-5 px-6 text-lg justify-start text-left whitespace-normal transition-all duration-200 hover:scale-[1.02] hover:shadow-md border-2",
                    isSelected 
                        ? "ring-2 ring-primary ring-offset-2 border-primary bg-primary text-white" 
                        : "border-slate-100 [@media(hover:hover)and(pointer:fine)]:hover:border-primary/50 text-slate-700"
                )}
                onClick={() => submitAnswer(option.id)}
                disabled={!!isValidAnswer}
            >
                <span className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mr-4 text-sm font-bold shrink-0 transition-colors",
                    isSelected ? "bg-white text-primary" : "bg-slate-100 text-slate-500"
                )}>
                    {String.fromCharCode(65 + idx)}
                </span>
                <span className="font-medium leading-snug">{option.text}</span>
            </Button>
        )})}
      </div>
      
      {lastAnswerId && question.options?.some(o => o.id === lastAnswerId) && (
          <div className="mt-auto py-4 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium animate-pulse shadow-lg">
                  <CheckCircle2 size={16} /> Answer Submitted
              </span>
          </div>
      )}
    </div>
  );
}

