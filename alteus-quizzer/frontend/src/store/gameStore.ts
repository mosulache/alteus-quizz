import { create } from 'zustand';

// Types
export type Question = {
  id: string;
  text: string;
  options: { id: string; text: string; isCorrect?: boolean }[];
  explanation?: string;
  timeLimit: number;
  media?: string;
};

export type Participant = {
  id: string;
  name: string;
  color: string;
  score: number;
};

export type GameStatus = 'WAITING' | 'ACTIVE' | 'REVIEW' | 'FINISHED';

type GameState = {
  // Connection
  socket: WebSocket | null;
  isConnected: boolean;
  error: string | null;

  // Participant State
  currentPlayer: { id: string; name: string; color: string } | null;
  isHost: boolean;
  lastAnswerId: string | null;
  
  // Session State
  sessionCode: string | null;
  status: GameStatus;
  currentQuestionIndex: number;
  timeRemaining: number;
  connectedParticipantsCount: number;
  answersReceived: number;
  
  // Data
  quiz: {
    title: string;
    questions: Question[]; // Note: Backend might send just current question or all if host
    totalQuestions: number;
  } | null;
  
  currentQuestion: Question | null;
  participants: Participant[]; 

  settings: {
    pointsSystem: string;
    leaderboardFrequency: string;
    enableTestMode: boolean;
    requirePlayerNames: boolean;
    organizationName: string;
  } | null;

  lastAwards: Record<string, number>;
  
  // Actions
  connect: (name: string, code: string, isHost?: boolean, existingClientId?: string) => void;
  tryReconnect: () => void;
  disconnect: () => void;
  startQuiz: () => void;
  nextQuestion: () => void;
  submitAnswer: (answerId: string) => void;
  reset: () => void;
  resetSession: () => void;
  skipTimer: () => void;
};

// Detect host automatically
const HOST = window.location.hostname;
const WS_URL = `ws://${HOST}:8000/ws`;

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  isConnected: false,
  error: null,
  currentPlayer: null,
  isHost: false,
  lastAnswerId: null,
  sessionCode: null,
  status: 'WAITING',
  currentQuestionIndex: 0,
  timeRemaining: 0,
  connectedParticipantsCount: 0,
  answersReceived: 0,
  quiz: null,
  currentQuestion: null,
  participants: [],
  settings: null,
  lastAwards: {},

  connect: (name, code, isHost = false, existingClientId) => {
    // Check for existing ID or generate new
    const clientId = existingClientId || (isHost ? 'host' : Math.random().toString(36).substr(2, 9));

    // Set session code immediately so UI can render it without waiting for WS handshake
    set({ sessionCode: code, isHost, error: null });
    
    // Persist session if not host
    if (!isHost) {
        localStorage.setItem('quiz_session', JSON.stringify({
            code,
            name,
            clientId,
            // also color needs to be consistent, but we generate it on socket open currently. 
            // We should ideally generate it here or save it after join.
            // For now let's just save the essentials for reconnect.
        }));
    }

    const ws = new WebSocket(`${WS_URL}/${code}/${clientId}`);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      set({ isConnected: true, error: null, sessionCode: code, isHost });
      
      if (!isHost) {
        // Send JOIN action
        // Try to recover color if we had one (need to update store to save color first)
        // Or generate new color if first time
        const stored = localStorage.getItem('quiz_session');
        let color = "#EF4444"; // Default fallback
        if (stored) {
             const data = JSON.parse(stored);
             if (data.color) color = data.color;
             else {
                 const colors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
                 color = colors[Math.floor(Math.random() * colors.length)];
                 // Update storage with color
                 localStorage.setItem('quiz_session', JSON.stringify({ ...data, color }));
             }
        } else {
             // Should not happen if we just set it above, but for safety
             const colors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
             color = colors[Math.floor(Math.random() * colors.length)];
        }

        ws.send(JSON.stringify({ 
          action: 'JOIN', 
          name, 
          color 
        }));
        
        set({ currentPlayer: { id: clientId, name, color } });
      } else {
          set({ currentPlayer: { id: 'host', name: 'Host', color: '#000' } });
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);

      if (data.type === 'STATE_UPDATE') {
        const state = data.state;
        
        // Reset lastAnswerId if we moved to a new question (and we are not just reconnecting to same q)
        // We can check if currentQuestion ID changed
        const currentQId = get().currentQuestion?.id;
        const newQId = state.currentQuestion?.id;
        
        // Robust Reset Logic
        // Calculate if we need to reset the answer BEFORE updating the state
        const shouldResetAnswer = 
            (newQId && newQId !== currentQId) || // Question changed
            (state.status === 'WAITING' && get().status !== 'WAITING') || // Game reset
            (state.status === 'ACTIVE' && get().status === 'REVIEW'); // New round started from review

        set({
            status: state.status,
            currentQuestionIndex: state.currentQuestionIndex,
            timeRemaining: state.timeRemaining,
            participants: state.participants,
            currentQuestion: state.currentQuestion,
            connectedParticipantsCount: state.connectedParticipantsCount ?? 0,
            answersReceived: state.answersReceived ?? 0,
            quiz: { 
                title: "Quiz", // Backend doesn't send full quiz title in state usually, maybe fix backend
                questions: [], 
                totalQuestions: state.totalQuestions 
            },
            settings: state.settings || null,
            lastAwards: state.lastAwards || {},
            // Atomically reset answer if needed. This overwrites any previous value in the state update if merged incorrectly,
            // but here we are replacing the whole state slice or merging? Zustand 'set' merges top level.
            // If we provide lastAnswerId: null, it overwrites.
            ...(shouldResetAnswer ? { lastAnswerId: null } : {})
        });
      } else if (data.type === 'TICK') {
          set({ timeRemaining: data.timeRemaining });
      }
    };

    ws.onclose = () => {
      console.log('Disconnected');
      set({ isConnected: false, socket: null });
    };
    
    ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        set({ error: 'Connection failed' });
    };

    set({ socket: ws });
  },

  tryReconnect: () => {
    const stored = localStorage.getItem('quiz_session');
    if (stored) {
        try {
            const { code, name, clientId } = JSON.parse(stored);
            if (code && name && clientId) {
                console.log("Attempting reconnect...", { code, name, clientId });
                get().connect(name, code, false, clientId);
            }
        } catch (e) {
            console.error("Failed to parse session", e);
            localStorage.removeItem('quiz_session');
        }
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, isConnected: false });
    }
    // Don't clear localStorage on disconnect, only on explicit reset/leave
  },

  startQuiz: () => {
    const { socket, isHost } = get();
    if (socket && isHost) {
      socket.send(JSON.stringify({ action: 'START_GAME' }));
    }
  },

  nextQuestion: () => {
    const { socket, isHost } = get();
    if (socket && isHost) {
      socket.send(JSON.stringify({ action: 'NEXT_QUESTION' }));
    }
  },

  submitAnswer: (answerId) => {
    const { socket, isHost } = get();
    if (socket && !isHost) {
      socket.send(JSON.stringify({ action: 'SUBMIT_ANSWER', answerId }));
      set({ lastAnswerId: answerId });
    }
  },

  resetSession: () => {
    const { socket, isHost } = get();
    if (socket && isHost) {
      socket.send(JSON.stringify({ action: 'RESET' }));
    }
  },

  skipTimer: () => {
    const { socket, isHost } = get();
    if (socket && isHost) {
      socket.send(JSON.stringify({ action: 'SKIP_TIMER' }));
    }
  },

  reset: () => {
      get().disconnect();
      localStorage.removeItem('quiz_session'); // Clear session
      set({ 
        socket: null, 
        isConnected: false, 
        sessionCode: null, 
        status: 'WAITING',
        currentQuestionIndex: 0,
        participants: [],
        currentQuestion: null,
        settings: null,
        lastAwards: {},
        connectedParticipantsCount: 0,
        answersReceived: 0
      });
  }
}));
