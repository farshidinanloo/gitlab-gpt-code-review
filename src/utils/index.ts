export const SEVERITY_COLORS = {
	high: '#ff4444',
	medium: '#ffbb33',
	low: '#00C851',
	default: '#666666',
} as const;

export const debounce = <T extends (...args: any[]) => void>(
	func: T,
	delay: number
) => {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
};

export const getSeverityColor = (severity: string): string => {
	return (
		SEVERITY_COLORS[severity.toLowerCase() as keyof typeof SEVERITY_COLORS] ||
		SEVERITY_COLORS.default
	);
};
