import {CodeAnalysis} from './types';

export class GPTAPI {
	private apiKey: string | null = null;
	private static readonly API_URL = 'https://api.avalai.ir/v1/chat/completions';
	private static readonly STORAGE_KEY = 'gptApiKey';

	constructor() {
		this.initializeApiKey();
	}

	private async initializeApiKey(): Promise<void> {
		const result = await chrome.storage.local.get(GPTAPI.STORAGE_KEY);
		this.apiKey = result[GPTAPI.STORAGE_KEY];
	}

	private async getModel(): Promise<string> {
		const result = await chrome.storage.local.get('gptModel');
		return result.gptModel || 'gpt-3.5-turbo';
	}

	async analyzeCodeChanges(changes: unknown[]): Promise<CodeAnalysis> {
		if (!this.apiKey) {
			throw new Error('GPT API key not set');
		}

		const prompt = this.generatePrompt(changes);
		const response = await this.makeAPIRequest(prompt);
		return this.parseGPTResponse(response);
	}

	private async makeAPIRequest(prompt: string): Promise<string> {
		const model = await this.getModel();
		const response = await fetch(GPTAPI.API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: 'system',
						content:
							'You are a code review assistant. Analyze the code changes and provide specific suggestions for improvement.',
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			throw new Error(
				`GPT API error: ${response.statusText} (${response.status})`
			);
		}

		const data = await response.json();
		return data.choices[0].message.content;
	}

	extractMistakesWithLineNumbers(
		diff: string
	): {line: number; message: string; oldLine: number}[] {
		const mistakes: {line: number; message: string; oldLine: number}[] = [];
		const lines = diff.split('\n');

		let oldLine = 0;
		let newLine = 0;

		for (const line of lines) {
			const headerMatch = line.match(/^@@ -(\d+),?\d* \+(\d+),?\d* @@/);
			if (headerMatch) {
				oldLine = parseInt(headerMatch[1], 10);
				newLine = parseInt(headerMatch[2], 10);
				continue;
			}

			if (line.startsWith(' ')) {
				oldLine++;
				newLine++;
			} else if (line.startsWith('-')) {
				oldLine++;
			} else if (line.startsWith('+')) {
				const mistakeMatch = line.match(/\/\/ Mistake \d+: (.+)/);
				if (mistakeMatch) {
					mistakes.push({
						line: newLine,
						oldLine: oldLine,
						message: mistakeMatch[1].trim(),
					});
				}
				newLine++;
			}
		}

		return mistakes;
	}

	private generatePrompt(changes: unknown[]): string {
		const lineNumbers = changes.map((change: any) => {
			return this.extractMistakesWithLineNumbers(change.diff);
		});
		return `Please analyze these code changes and provide specific suggestions for improvement:
${JSON.stringify(changes, null, 2)}

Focus on:
1. Code quality and best practices
2. Potential bugs or security issues
3. Performance considerations
4. Maintainability and readability

For each suggestion, include a code block showing the suggested implementation.

please be more careful about line number because i want to call gitlab api to comment on the changes.
this is the line numbers of the changes:
${JSON.stringify(lineNumbers, null, 2)}
Format your response as a JSON object with 'suggestions' and 'summary' fields like this: {
  "suggestions":  [
    {
      "file":  "filename.js",
			"data": [
				{
					"line": 42,
					"suggestion": "Consider using const instead of let as this variable is never reassigned",
					"severity": "low",
					"code": "const myVariable = 'value';"
				}
			]
    }
  ],
  "summary": "Overall assessment of the code changes and key recommendations"
}`;
	}

	private parseGPTResponse(response: string): CodeAnalysis {
		try {
			const parsed = JSON.parse(response) as CodeAnalysis;
			this.validateResponse(parsed);
			return parsed;
		} catch (error) {
			console.error('Error parsing GPT response:', error);
			throw new Error('Failed to parse GPT response');
		}
	}

	private validateResponse(
		response: unknown
	): asserts response is CodeAnalysis {
		if (!response || typeof response !== 'object') {
			throw new Error('Invalid response format');
		}
	}

	async setApiKey(apiKey: string): Promise<void> {
		this.apiKey = apiKey;
		await chrome.storage.local.set({[GPTAPI.STORAGE_KEY]: apiKey});
	}
}
