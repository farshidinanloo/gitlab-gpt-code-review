import { MergeRequestChange } from './types';

export class GitLabAPI {
	private projectId: string | null = null;
	private diffRefs: {
		base_sha: string;
		start_sha: string;
		head_sha: string;
	} | null = null;

	constructor() {}

	private async getLocalData(): Promise<{
		gitlabToken: string;
		pathname: string;
		gitlabBase: string;
	}> {
		const tokenResult = await chrome.storage.local.get('gitlabToken');
		const pathnameResult = await chrome.storage.local.get('pathname');
		const gitlabBaseResult = await chrome.storage.local.get('gitlabBase');

		return {
			gitlabToken: tokenResult.gitlabToken,
			pathname: pathnameResult.pathname,
			gitlabBase: gitlabBaseResult.gitlabBase,
		};
	}

	private async getProjectId(): Promise<string | null> {
		const { pathname, gitlabBase, gitlabToken } = await this.getLocalData();
		if (!pathname) {
			return null;
		}

		const projectName = this.extractProjectInfo(pathname);

		const token = gitlabToken || null;

		try {
			const response = await fetch(
				`${gitlabBase}/api/v4/projects/${encodeURIComponent(projectName)}`,
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
			this.projectId = data.id;
			return data.id;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to fetch merge request changes: ${errorMessage}`);
		}
	}

	private extractProjectInfo(urlPath: string): string {
		const splitIndex = urlPath.indexOf('/-/merge_requests');
		if (splitIndex === -1) {
			return urlPath;
		}
		return urlPath.substring(urlPath.startsWith('/') ? 1 : 0, splitIndex);
	}

	async getMergeRequestChanges(
		mergeRequestId: string
	): Promise<MergeRequestChange[]> {
		// this.validateToken();
		const { gitlabBase, gitlabToken } = await this.getLocalData();

		if (!this.projectId) {
			await this.getProjectId();
		}

		if (!this.projectId) {
			throw new Error('Project ID not provided');
		}

		try {
			const response = await fetch(
				`${gitlabBase}/api/v4/projects/${this.projectId}/merge_requests/${mergeRequestId}/changes`,
				{
					headers: {
						'PRIVATE-TOKEN': gitlabToken!,
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
		// this.validateToken();

		if (!this.projectId) {
			throw new Error('Project ID not provided');
		}
		const { gitlabBase, gitlabToken } = await this.getLocalData();
		try {
			const response = await fetch(
				`${gitlabBase}/api/v4/projects/${this.projectId}/merge_requests/${mergeRequestId}/discussions`,
				{
					method: 'POST',
					headers: {
						'PRIVATE-TOKEN': gitlabToken,
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
		chrome.storage.local.set({ gitlabToken: token });
	}

	setUrl(url: string): void {
		chrome.storage.local.set({ url });
	}
}
