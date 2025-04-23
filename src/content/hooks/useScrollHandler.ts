import type {BuiltinTheme, BuiltinLanguage, HighlighterGeneric} from 'shiki';
import {debounce} from '../../utils';
import {useEffect} from 'react';
import {Analysis} from './types';

export const useScrollHandler = (
	highlighter: HighlighterGeneric<BuiltinLanguage, BuiltinTheme> | undefined,
	analysis: Analysis | undefined,
	addSuggestionElements: () => void
) => {
	useEffect(() => {
		if (!highlighter || !analysis) return;
		addSuggestionElements();

		const handleScroll = debounce(() => {
			addSuggestionElements();
		}, 200);

		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [analysis, addSuggestionElements, highlighter]);
};
