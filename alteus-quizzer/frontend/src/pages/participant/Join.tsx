import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";

export function Join() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const connect = useGameStore((state) => state.connect);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const qp = (searchParams.get("code") || "").trim();
    if (qp) setCode(qp.toUpperCase());
  }, [searchParams]);

  const handleJoin = () => {
    if (name && code) {
      connect(name, code);
      navigate("/lobby");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto mt-10 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">Join Quiz</h1>
        <p className="text-slate-500">Enter session code to start</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
            <label className="text-sm font-medium">Session Code</label>
            <Input 
                placeholder="Ex: A1B2" 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center uppercase text-lg tracking-widest font-mono"
            />
        </div>
        <div className="space-y-2">
            <label className="text-sm font-medium">Your Name</label>
            <Input 
                placeholder="Enter your name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
            />
        </div>
        <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" onClick={handleJoin} disabled={!name || !code}>
          Join Session
        </Button>
      </div>
    </div>
  );
}

