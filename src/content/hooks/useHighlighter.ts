import {useEffect, useState} from 'react';
import * as shiki from 'shiki';
import type {BuiltinTheme, BuiltinLanguage, HighlighterGeneric} from 'shiki';

export const useHighlighter = () => {
	const [highlighter, setHighlighter] =
		useState<HighlighterGeneric<BuiltinLanguage, BuiltinTheme>>();

	useEffect(() => {
		const initHighlighter = async () => {
			try {
				const h = await shiki.createHighlighter({
					themes: ['github-dark'],
					langs: ['typescript', 'javascript'],
				});
				setHighlighter(h);
			} catch (error) {
				console.error('Failed to initialize Shiki highlighter:', error);
			}
		};
		initHighlighter();
	}, []);

	return highlighter;
};
