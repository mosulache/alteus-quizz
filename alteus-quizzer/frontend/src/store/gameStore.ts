import { create } from 'zustand';

// Types
export type Question = {
  id: string;
  text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
  timeLimit: number;
  media?: string;
};

export type Participant = {
  id: string;
  name: string;
  color: string;
  score: number;
};

type GameState = {
  // Participant State
  currentPlayer: Participant | null;
  lastAnswerId: string | null;
  
  // Session State
  sessionCode: string;
  status: 'WAITING' | 'ACTIVE' | 'REVIEW' | 'FINISHED'; // REVIEW = Showing answer
  currentQuestionIndex: number;
  timeRemaining: number;
  
  // Data
  quiz: {
    title: string;
    questions: Question[];
  };
  participants: Participant[]; // For Host view
  
  // Actions
  joinSession: (name: string, code: string) => void;
  startQuiz: () => void;
  nextQuestion: () => void;
  submitAnswer: (answerId: string) => void;
  tick: () => void; // For timer
  reset: () => void;
  forceStatus: (status: 'WAITING' | 'ACTIVE' | 'REVIEW' | 'FINISHED') => void;
};

// Mock Data
const MOCK_QUIZ = {
  title: "AI Fundamentals",
  questions: [
    {
      id: "q1",
      text: "What does LLM stand for?",
      timeLimit: 15,
      options: [
        { id: "a", text: "Large Language Model", isCorrect: true },
        { id: "b", text: "Low Latency Memory", isCorrect: false },
        { id: "c", text: "Linear Learning Machine", isCorrect: false },
        { id: "d", text: "Logical Layer Matrix", isCorrect: false },
      ],
      explanation: "LLM stands for Large Language Model, a type of AI model trained on vast amounts of text data."
    },
    {
        id: "q2",
        text: "Which of the following is NOT a type of machine learning?",
        timeLimit: 15,
        options: [
          { id: "a", text: "Supervised Learning", isCorrect: false },
          { id: "b", text: "Unsupervised Learning", isCorrect: false },
          { id: "c", text: "Reinforcement Learning", isCorrect: false },
          { id: "d", text: "Turbo Learning", isCorrect: true },
        ],
        explanation: "Turbo Learning is not a recognized category of machine learning."
    },
    {
        id: "q3",
        text: "What is the primary function of a Transformer architecture?",
        timeLimit: 20,
        options: [
            { id: "a", text: "Image compression", isCorrect: false },
            { id: "b", text: "Parallel processing of sequential data", isCorrect: true },
            { id: "c", text: "Database indexing", isCorrect: false },
            { id: "d", text: "Voice synthesis", isCorrect: false }
        ],
        explanation: "Transformers allow for parallel processing of sequential data using self-attention mechanisms."
    }
  ]
};

export const useGameStore = create<GameState>((set, get) => ({
  currentPlayer: null,
  lastAnswerId: null,
  sessionCode: "A1B2",
  status: 'WAITING',
  currentQuestionIndex: 0,
  timeRemaining: 0,
  quiz: MOCK_QUIZ,
  participants: [
    { id: "p1", name: "Alice", color: "#EF4444", score: 1200 },
    { id: "p2", name: "Bob", color: "#3B82F6", score: 950 },
    { id: "p3", name: "Charlie", color: "#10B981", score: 800 },
  ],

  joinSession: (name, code) => {
    const colors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newPlayer = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        color: randomColor,
        score: 0
    };
    
    set((state) => ({
      currentPlayer: newPlayer,
      participants: [...state.participants, newPlayer]
    }));
  },

  startQuiz: () => {
    const firstQ = get().quiz.questions[0];
    set({ 
      status: 'ACTIVE', 
      currentQuestionIndex: 0, 
      timeRemaining: firstQ.timeLimit 
    });
  },

  nextQuestion: () => {
    const { currentQuestionIndex, quiz } = get();
    if (currentQuestionIndex < quiz.questions.length - 1) {
      const nextQ = quiz.questions[currentQuestionIndex + 1];
      set({ 
        status: 'ACTIVE', 
        currentQuestionIndex: currentQuestionIndex + 1,
        timeRemaining: nextQ.timeLimit,
        lastAnswerId: null // Reset answer for new question
      });
    } else {
      set({ status: 'FINISHED' });
    }
  },

  submitAnswer: (answerId) => {
     set({ lastAnswerId: answerId });
  },
  
  tick: () => {
      const { timeRemaining, status } = get();
      if (status === 'ACTIVE' && timeRemaining > 0) {
          set({ timeRemaining: timeRemaining - 1 });
      } else if (status === 'ACTIVE' && timeRemaining === 0) {
          set({ status: 'REVIEW' });
      }
  },

  reset: () => {
      set({ status: 'WAITING', currentQuestionIndex: 0, timeRemaining: 0, lastAnswerId: null });
  },

  forceStatus: (status) => set({ status })
}));

