import {useCallback} from 'react';
import type {BuiltinTheme, BuiltinLanguage, HighlighterGeneric} from 'shiki';
import {getSeverityColor} from '../../utils';

export const useSuggestionElements = (
	analysis: any,
	highlighter: HighlighterGeneric<BuiltinLanguage, BuiltinTheme> | undefined
) => {
	return useCallback(() => {
		if (analysis?.suggestions && analysis.suggestions.length > 0) {
			analysis.suggestions.forEach((suggestion: any) => {
				const element = document.querySelector(
					`[data-path="${suggestion.file}"]`
				) as HTMLDivElement;
				if (element) {
					const existingSuggestion = element.nextSibling as HTMLElement;
					if (
						existingSuggestion &&
						existingSuggestion.classList &&
						existingSuggestion.classList.contains('code-review-suggestion')
					) {
						return;
					}

					const container = document.createElement('div');
					container.className = 'code-review-suggestion';

					suggestion.data.forEach((item: any) => {
						const severityLabel = document.createElement('span');
						severityLabel.textContent = item.severity.toUpperCase();
						severityLabel.className = 'severity-label';
						severityLabel.style.backgroundColor = getSeverityColor(
							item.severity
						);
						container.appendChild(severityLabel);

						const lineNumber = document.createElement('span');
						lineNumber.textContent = `Line ${item.line}: `;
						lineNumber.className = 'line-number';
						container.appendChild(lineNumber);

						const suggestionText = document.createElement('div');
						suggestionText.textContent = item.suggestion;
						suggestionText.className = 'suggestion-text';
						container.appendChild(suggestionText);

						if (item.code && highlighter) {
							const codeBlock = document.createElement('div');
							const code = highlighter.codeToHtml(item.code, {
								lang: 'typescript',
								theme: 'github-dark',
							});
							codeBlock.innerHTML = code;
							codeBlock.classList.add('shiki', 'shiki-with-line-numbers');
							container.appendChild(codeBlock);
						}

						container.appendChild(document.createElement('hr'));
					});

					element.parentNode?.insertBefore(container, element.nextSibling);
				}
			});
		}
	}, [analysis?.suggestions, highlighter]);
};
