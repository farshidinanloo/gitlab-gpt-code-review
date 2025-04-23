import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import {
	useAnalysis,
	useHighlighter,
	useScrollHandler,
	useSuggestionElements,
} from './hooks';

// TODO
// code font
// model select
// comment or info
// record video with no audio
const AnalysisButton: React.FC = () => {
	const analysis = useAnalysis();
	const highlighter = useHighlighter();
	const addSuggestionElements = useSuggestionElements(analysis, highlighter);
	useScrollHandler(highlighter, analysis, addSuggestionElements);


	return null;
};

const buttonContainer = document.createElement('div');
buttonContainer.id = 'code-review-assistant-button';
document.body.appendChild(buttonContainer);

const root = createRoot(buttonContainer);
root.render(<AnalysisButton />);
