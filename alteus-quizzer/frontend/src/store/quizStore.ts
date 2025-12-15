import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

// Types mirroring Backend Models
export type AnswerOption = {
    id?: number;
    text: string;
    is_correct: boolean;
    order: number;
};

export type Question = {
    id?: number;
    text: string;
    time_limit?: number;
    points: number;
    order: number;
    explanation?: string;
    media_url?: string;
    question_type: string;
    options: AnswerOption[];
};

export type Quiz = {
    id: number;
    title: string;
    description?: string;
    background_image?: string;
    default_time_limit: number;
    created_at: string;
    questions: Question[];
};

export type QuizCreate = Omit<Quiz, 'id' | 'created_at' | 'questions'> & {
    questions: Omit<Question, 'id'>[];
};

type QuizStore = {
    quizzes: Quiz[];
    isLoading: boolean;
    error: string | null;
    
    fetchQuizzes: () => Promise<void>;
    createQuiz: (quiz: QuizCreate) => Promise<void>;
    updateQuiz: (id: number, quiz: QuizCreate) => Promise<void>;
    getQuiz: (id: number) => Promise<Quiz | null>;
    createSession: (quizId: number) => Promise<string>; // Returns session code
};

export const useQuizStore = create<QuizStore>((set, get) => ({
    quizzes: [],
    isLoading: false,
    error: null,

    fetchQuizzes: async () => {
        set({ isLoading: true, error: null });
        try {
            const quizzes = await apiRequest<Quiz[]>('/quizzes/');
            set({ quizzes, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    createQuiz: async (quizData) => {
        set({ isLoading: true, error: null });
        try {
            const newQuiz = await apiRequest<Quiz>('/quizzes/', {
                method: 'POST',
                body: JSON.stringify(quizData),
            });
            set((state) => ({ 
                quizzes: [...state.quizzes, newQuiz], 
                isLoading: false 
            }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    updateQuiz: async (id, quizData) => {
        set({ isLoading: true, error: null });
        try {
            await apiRequest<Quiz>(`/quizzes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(quizData),
            });
            // Refresh list
            await get().fetchQuizzes();
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    getQuiz: async (id) => {
        try {
            return await apiRequest<Quiz>(`/quizzes/${id}`);
        } catch (err: any) {
            console.error(err);
            return null;
        }
    },

    createSession: async (quizId) => {
        try {
            const res = await apiRequest<{ code: string }>(`/sessions/?quiz_id=${quizId}`, {
                method: 'POST',
            }); 
            return res.code;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }
}));
