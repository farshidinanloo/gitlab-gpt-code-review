import React from 'react';
import type { HighlighterGeneric, BuiltinLanguage, BuiltinTheme } from 'shiki';
import { CodeSuggestion } from '../types/analysis';
import { getSeverityColor } from '../utils';

interface Props {
	suggestions: CodeSuggestion[];
	highlighter: HighlighterGeneric<BuiltinLanguage, BuiltinTheme>;
}

export const SuggestionContainer: React.FC<Props> = ({
	suggestions,
	highlighter,
}) => {
	return (
		<div className='code-review-suggestion'>
			{suggestions.map((item, index) => (
				<div key={index} className='suggestion-item'>
					<span
						className='severity-label'
						style={{ backgroundColor: getSeverityColor(item.severity) }}
					>
						{item.severity.toUpperCase()}
					</span>

					<span className='line-number'>Line {item.line}: </span>

					<div className='suggestion-text'>{item.suggestion}</div>

					{item.code && (
						<div
							className='shiki shiki-with-line-numbers'
							dangerouslySetInnerHTML={{
								__html: highlighter.codeToHtml(item.code, {
									lang: 'typescript',
									theme: 'github-dark',
								}),
							}}
						/>
					)}

					<hr />
				</div>
			))}
		</div>
	);
};
