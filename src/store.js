import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
    persist(
        (set) => ({
            currency: '$',
            setCurrency: (currency) => set({ currency }),
            themePrimary: '#6366f1',
            setThemePrimary: (themePrimary) => set({ themePrimary }),
            themeSecondary: '#ec4899',
            setThemeSecondary: (themeSecondary) => set({ themeSecondary }),
        }),
        {
            name: 'splitsync-settings',
        }
    )
);
