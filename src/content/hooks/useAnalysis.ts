import { useEffect } from 'react';

import { useState } from 'react';
import { Analysis } from './types';

export const useAnalysis = () => {
	const [analysis, setAnalysis] = useState<Analysis>();

	useEffect(() => {
		chrome.runtime.onMessage.addListener((message) => {
			if (message.type === 'ANALYSIS_RESULT') {
				setAnalysis(message.analysis);
			}
		});
	}, []);

	return analysis;
};
