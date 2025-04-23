export interface CodeSuggestion {
	line: number;
	suggestion: string;
	severity: 'high' | 'medium' | 'low';
	code: string;
}

export interface FileAnalysis {
	file: string;
	data: CodeSuggestion[];
}

export interface AnalysisResult {
	suggestions: FileAnalysis[];
	summary: string;
}
