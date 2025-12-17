import { create } from "zustand";
import { apiRequest } from "@/lib/api";

export type AppSettings = {
  id: number;
  default_timer_seconds: number;
  points_system: "standard" | "simple" | "no_points" | string;
  leaderboard_frequency: "every_round" | "end_only" | "top_3" | string;
  enable_test_mode: boolean;
  require_player_names: boolean;
  organization_name: string;
  updated_at: string;
};

type SettingsStore = {
  settings: AppSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchSettings: () => Promise<AppSettings | null>;
  saveSettings: (payload: Partial<AppSettings>) => Promise<AppSettings>;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await apiRequest<AppSettings>("/settings");
      set({ settings, isLoading: false });
      return settings;
    } catch (err: any) {
      set({ error: err.message || "Failed to load settings", isLoading: false });
      return null;
    }
  },

  saveSettings: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      const updated = await apiRequest<AppSettings>("/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      set({ settings: updated, isSaving: false });
      return updated;
    } catch (err: any) {
      set({ error: err.message || "Failed to save settings", isSaving: false });
      throw err;
    }
  },
}));


