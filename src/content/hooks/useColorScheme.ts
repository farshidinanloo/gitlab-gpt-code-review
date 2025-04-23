import { useState, useEffect } from 'react';

export const useColorScheme = () => {
	const [isDark, setIsDark] = useState(
		() => window.matchMedia('(prefers-color-scheme: dark)').matches
	);

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	return isDark;
};
