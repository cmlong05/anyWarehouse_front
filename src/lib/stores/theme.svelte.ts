import { browser } from '$app/environment';

export type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'theme-mode';

/** 夜间时段（24 小时制，跨天）：19:00 ~ 次日 6:00 */
const NIGHT_START_HOUR = 19;
const NIGHT_END_HOUR = 6;

function isNightTime(date: Date = new Date()): boolean {
	const h = date.getHours();
	return h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR;
}

function resolveDark(mode: ThemeMode, date: Date = new Date()): boolean {
	return mode === 'dark' || (mode === 'auto' && isNightTime(date));
}

function applyTheme(mode: ThemeMode) {
	if (!browser) return;
	document.documentElement.dataset.theme = resolveDark(mode) ? 'dark' : 'light';
}

function readStoredMode(): ThemeMode {
	if (!browser) return 'auto';
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto';
}

export const themeState = $state<{ mode: ThemeMode }>({ mode: 'auto' });

export function setThemeMode(mode: ThemeMode) {
	themeState.mode = mode;
	if (browser) localStorage.setItem(STORAGE_KEY, mode);
	applyTheme(mode);
}

/** 循环切换：auto → light → dark → auto */
export function cycleThemeMode() {
	const next: Record<ThemeMode, ThemeMode> = { auto: 'light', light: 'dark', dark: 'auto' };
	setThemeMode(next[themeState.mode]);
}

if (browser) {
	themeState.mode = readStoredMode();
	applyTheme(themeState.mode);
	// auto 模式下跨过夜间边界时自动切换（每分钟检查一次）
	setInterval(() => {
		if (themeState.mode === 'auto') applyTheme(themeState.mode);
	}, 60_000);
}
