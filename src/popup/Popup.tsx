import React, { useState, useEffect } from 'react';
import { GitLabAPI } from '../api/gitlab';
import { GPTAPI } from '../api/gpt';
import styles from './Popup.module.css';
import { models } from '../constants';

const gitlabApi = new GitLabAPI();
const gptApi = new GPTAPI();

export const Popup: React.FC = () => {
	const [gitlabToken, setGitlabToken] = useState('');
	const [gptApiKey, setGptApiKey] = useState('');
	const [selectedModel, setSelectedModel] = useState('gpt-4');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isAddComment, setIsAddComment] = useState(false);
	const [gitlabBase, setGitlabBase] = useState('https://gitlab.com');
	const [pathname, setPathname] = useState('');

	useEffect(() => {
		chrome.storage.local.get(
			[
				'gitlabToken',
				'gptApiKey',
				'gptModel',
				'isAddComment',
				'gitlabBase',
				'pathname',
			],
			(result) => {
				if (result.gitlabToken) setGitlabToken(result.gitlabToken);
				if (result.gptApiKey) setGptApiKey(result.gptApiKey);
				if (result.gptModel) setSelectedModel(result.gptModel);
				if (result.isAddComment) setIsAddComment(result.isAddComment);
			}
		);

		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs.length > 0 && tabs[0].url) {
				const parsed = new URL(tabs[0].url);
				setGitlabBase(parsed.origin);
				setPathname(parsed.pathname);
			}
		});
	}, []);

	const handleSaveSettings = async () => {
		gitlabApi.setToken(gitlabToken);
		gptApi.setApiKey(gptApiKey);
		chrome.storage.local.set({
			gitlabToken,
			gptApiKey,
			gptModel: selectedModel,
			isAddComment,
			gitlabBase,
			pathname,
		});

		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (!tab.url?.includes('/merge_requests/')) {
			return;
		}

		gitlabApi.setUrl(tab.url);
	};

	const handleAnalyze = async () => {
		setLoading(true);
		setError(null);

		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			if (!tab.url?.includes('/merge_requests/')) {
				throw new Error('Please navigate to a GitLab merge request page');
			}

			const urlParts = tab.url.split('/');
			const mrIndex = urlParts.indexOf('merge_requests');
			if (mrIndex === -1) {
				throw new Error('Invalid GitLab merge request URL');
			}
			const projectId = urlParts.slice(4, mrIndex).join('/');
			const mergeRequestId = urlParts[mrIndex + 1];

			chrome.runtime.sendMessage(
				{
					type: 'ANALYZE_MERGE_REQUEST',
					payload: { projectId, mergeRequestId, url: tab.url },
				},
				(response) => {
					if (response.success) {
						chrome.tabs.sendMessage(tab.id!, {
							type: 'ANALYSIS_RESULT',
							analysis: response.analysis,
						});
					} else {
						setError(response.error);
					}
					setLoading(false);
				}
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			setLoading(false);
		}
	};

	return (
		<div className={styles.container}>
			<h2 className={styles.title}>GitLab Code Review Assistant</h2>

			<div className={styles.section}>
				<h3 className={styles.sectionTitle}>Settings</h3>
				<div className={styles.inputGroup}>
					<label className={styles.label}>GitLab Token</label>
					<input
						className={styles.input}
						type='password'
						value={gitlabToken}
						onChange={(e) => setGitlabToken(e.target.value)}
					/>
				</div>
				<div className={styles.inputGroup}>
					<label className={styles.label}>Aval AI Key</label>
					<input
						className={styles.input}
						type='password'
						value={gptApiKey}
						onChange={(e) => setGptApiKey(e.target.value)}
					/>
				</div>
				<div className={styles.inputGroup}>
					<label className={styles.label}>GPT Model</label>
					<select
						className={styles.input}
						value={selectedModel}
						onChange={(e) => setSelectedModel(e.target.value)}
					>
						{models.map((model) => (
							<option key={model} value={model}>
								{model}
							</option>
						))}
					</select>
				</div>
				<div className={styles.inputGroup}>
					<label className={styles.label}>Mode</label>
					<div className={styles.checkboxContainer}>
						<input
							type='checkbox'
							id='addComment'
							checked={isAddComment}
							onChange={(e) => {
								setIsAddComment(e.target.checked);
							}}
							className={styles.checkbox}
						/>
						<label htmlFor='addComment' className={styles.checkboxLabel}>
							Add Comment
						</label>
					</div>
				</div>
				<button className={styles.button} onClick={handleSaveSettings}>
					Save Settings
				</button>
			</div>

			<div className={styles.section}>
				<button
					className={styles.buttonPrimary}
					onClick={handleAnalyze}
					disabled={loading}
				>
					{loading ? 'Analyzing...' : 'Analyze Current MR'}
				</button>
			</div>

			{error && <div className={styles.error}>{error}</div>}
		</div>
	);
};
