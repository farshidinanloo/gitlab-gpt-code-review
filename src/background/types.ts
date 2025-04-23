import { CodeAnalysis } from '../api/types';

export interface MergeRequestPayload {
	projectId: string;
	mergeRequestId: string;
	url: string;
}

export interface MessageResponse {
	success: boolean;
	analysis?: CodeAnalysis;
	error?: string;
}
