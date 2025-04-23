export class GitLabPageObserver {
	private static isGitLabMergeRequestPage(url: string): boolean {
		return url.includes('gitlab.com') && url.includes('/merge_requests/');
	}

	static handlePageUpdate(
		tabId: number,
		changeInfo: chrome.tabs.TabChangeInfo,
		tab: chrome.tabs.Tab
	): void {
		if (
			changeInfo.status === 'complete' &&
			tab.url &&
			this.isGitLabMergeRequestPage(tab.url)
		) {
			chrome.tabs.sendMessage(tabId, { type: 'PAGE_LOADED' });
		}
	}
}
