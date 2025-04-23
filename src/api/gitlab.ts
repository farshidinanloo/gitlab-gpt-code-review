import {GitLabConfig, MergeRequestChange} from './types';

export class GitLabAPI {
	private baseUrl: string;
	private token: string | null = null;
	private projectId: string | null = null;
	private diffRefs: {
		base_sha: string;
		start_sha: string;
		head_sha: string;
	} | null = null;

	constructor(config: GitLabConfig = {}) {
		this.baseUrl = config.baseUrl || 'https://gitlab.com/api/v4';
		this.initializeToken();
		this.getProjectId();
	}

	private async initializeToken(): Promise<void> {
		const result = await chrome.storage.local.get('gitlabToken');
		this.token = result.gitlabToken || null;
	}

	private async getProjectId(): Promise<string | null> {
		const urlData = (await chrome.storage.local.get('url')) as {url: string};
		if (!urlData.url) {
			return null;
		}

		const {projectName} = this.extractProjectInfo(urlData.url);

		const result = await chrome.storage.local.get('gitlabToken');
		const token = result.gitlabToken || null;

		try {
			const response = await fetch(
				`${this.baseUrl}/projects?search=${projectName}`,
				{
					headers: {
						'PRIVATE-TOKEN': token!,
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error(
					`GitLab API error: ${response.status} - ${response.statusText}`
				);
			}

			const data = await response.json();
			this.projectId = data[0].id;
			return data[0].id;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to fetch merge request changes: ${errorMessage}`);
		}
	}

	private validateToken(): void {
		if (!this.token) {
			throw new Error('GitLab token not set. Please call setToken() first.');
		}
	}

	private extractProjectInfo(gitlabUrl: string): {
		namespace: string;
		projectName: string;
	} {
		const regex = /gitlab\.com\/([^/]+)\/([^/]+)\//;
		const match = gitlabUrl.match(regex);

		if (match) {
			const [, namespace, projectName] = match;
			return {namespace, projectName};
		}

		throw new Error('Invalid GitLab URL');
	}

	async getMergeRequestChanges(
		mergeRequestId: string
	): Promise<MergeRequestChange[]> {
		this.validateToken();

		if (!this.projectId) {
			throw new Error('Project ID not provided');
		}

		try {
			const response = await fetch(
				`${this.baseUrl}/projects/${this.projectId}/merge_requests/${mergeRequestId}/changes`,
				{
					headers: {
						'PRIVATE-TOKEN': this.token!,
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error(
					`GitLab API error: ${response.status} - ${response.statusText}`
				);
			}

			const data = await response.json();
			this.diffRefs = data.diff_refs;
			return data.changes;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to fetch merge request changes: ${errorMessage}`);
		}
	}

	async commentOnMergeRequestChanges(
		mergeRequestId: string,
		_url: string,
		data: {
			body: string;
			position: {
				position_type: 'text';
				new_path: string;
				new_line: number;
			};
		}
	): Promise<MergeRequestChange[]> {
		this.validateToken();

		if (!this.projectId) {
			throw new Error('Project ID not provided');
		}

		try {
			const response = await fetch(
				`${this.baseUrl}/projects/${this.projectId}/merge_requests/${mergeRequestId}/discussions`,
				{
					method: 'POST',
					headers: {
						'PRIVATE-TOKEN': this.token!,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						body: data.body,
						position: {
							position_type: 'text',
							new_path: data.position.new_path,
							new_line: data.position.new_line,
							base_sha: this.diffRefs?.base_sha,
							start_sha: this.diffRefs?.start_sha,
							head_sha: this.diffRefs?.head_sha,
						},
					}),
				}
			);

			if (!response.ok) {
				throw new Error(
					`GitLab API error: ${response.status} - ${response.statusText}`
				);
			}

			const responseData = await response.json();
			return responseData.changes;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to fetch merge request changes: ${errorMessage}`);
		}
	}

	setToken(token: string): void {
		this.token = token;
		chrome.storage.local.set({gitlabToken: token});
	}

	setUrl(url: string): void {
		chrome.storage.local.set({url});
	}
}
