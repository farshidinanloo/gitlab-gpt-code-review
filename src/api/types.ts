export interface GPTSuggestion {
	line: number;
	suggestion: string;
	severity: 'low' | 'medium' | 'high';
	code: string;
}

export interface FileAnalysis {
	file: string;
	data: GPTSuggestion[];
}

export interface CodeAnalysis {
	suggestions: FileAnalysis[];
	summary: string;
}

export interface MergeRequestChange {
	old_path: string;
	new_path: string;
	diff: string;
}

export interface GitLabConfig {
	baseUrl?: string;
	projectId?: string;
}
