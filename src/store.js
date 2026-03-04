import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_PRIMARY = '#6366f1';
const DEFAULT_SECONDARY = '#ec4899';

export const useSettingsStore = create(
    persist(
        (set) => ({
            currency: '$',
            setCurrency: (currency) => set({ currency }),
            themePrimary: DEFAULT_PRIMARY,
            setThemePrimary: (themePrimary) => set({ themePrimary }),
            themeSecondary: DEFAULT_SECONDARY,
            setThemeSecondary: (themeSecondary) => set({ themeSecondary }),
            resetTheme: () => set({ themePrimary: DEFAULT_PRIMARY, themeSecondary: DEFAULT_SECONDARY }),
        }),
        {
            name: 'splitsync-settings',
        }
    )
);
