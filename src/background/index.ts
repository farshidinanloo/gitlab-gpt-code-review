import { GitLabPageObserver } from './gitLab-page-observer';
import { MergeRequestAnalyzer } from './merge-request-analyzer';

const mergeRequestAnalyzer = new MergeRequestAnalyzer();

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
	if (request.type === 'ANALYZE_MERGE_REQUEST') {
		mergeRequestAnalyzer
			.analyzeMergeRequest(request.payload)
			.then(sendResponse);
		return true;
	}
});

chrome.tabs.onUpdated.addListener(GitLabPageObserver.handlePageUpdate);
