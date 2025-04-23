import {GitLabAPI} from '../api/gitlab';
import {GPTAPI} from '../api/gpt';
import {MergeRequestPayload} from './types';
import {MessageResponse} from './types';

export class MergeRequestAnalyzer {
	private gitlabApi: GitLabAPI;
	private gptApi: GPTAPI;

	constructor() {
		this.gitlabApi = new GitLabAPI();
		this.gptApi = new GPTAPI();
	}

	async analyzeMergeRequest(
		payload: MergeRequestPayload
	): Promise<MessageResponse> {
		try {
			const changes = await this.gitlabApi.getMergeRequestChanges(
				payload.mergeRequestId
			);
			const analysis = await this.gptApi.analyzeCodeChanges(changes);
			const {isAddComment} = await chrome.storage.local.get('isAddComment');

			if (analysis && isAddComment) {
				const urlParts = payload.url.split('/');
				const mrIndex = urlParts.indexOf('merge_requests');
				if (mrIndex === -1) {
					throw new Error('Invalid GitLab merge request URL');
				}
				const mergeRequestId = urlParts[mrIndex + 1];

				analysis.suggestions.forEach((suggestion) => {
					suggestion.data.forEach((item) => {
						this.gitlabApi.commentOnMergeRequestChanges(
							mergeRequestId,
							payload.url,
							{
								body: `${item.suggestion}\n ${
									item.code ? `\`\`\`tsx\n${item.code}\n\`\`\`` : ''
								}`,
								position: {
									position_type: 'text',
									new_path: suggestion.file,
									new_line: item.line,
								},
							}
						);
					});
				});
			}
			return {success: true, analysis: !isAddComment ? analysis : undefined};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : 'An unknown error occurred',
			};
		}
	}
}
