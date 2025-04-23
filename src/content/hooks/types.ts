export interface Analysis {
	suggestions: {
		file: string;
		data: {
			line: number;
			suggestion: string;
			severity: string;
			code: string;
		}[];
	}[];
	summary: string;
}
