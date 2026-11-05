export interface MasterkeyAvailability {
	ready: boolean;
	paymentsEnabled: boolean;
	reason: string;
	operations: {
		serviceId: string;
		actionKey: string;
		executable: boolean;
		state: 'certified' | 'temporarily_unavailable';
		reason: string;
		policyHash: string;
		billing?: 'free' | 'paid';
	}[];
}

export function masterkeyOperationStatus(
	agentId: string,
	actionKey: string,
	data?: MasterkeyAvailability
) {
	if (!agentId.startsWith('masterkey:')) {
		return { executable: true, label: 'Available', reason: '' };
	}
	if (!data) {
		return {
			executable: false,
			label: 'Checking availability',
			reason: 'Availability must be checked before adding this operation.',
		};
	}
	if (!data.ready) {
		return { executable: false, label: 'Unavailable', reason: data.reason };
	}
	const operation = data.operations.find(
		op =>
			op.serviceId === agentId.slice('masterkey:'.length) &&
			op.actionKey === actionKey
	);
	if (!operation) {
		return {
			executable: false,
			label: 'Catalog only',
			reason: 'This operation needs a reviewed and enabled provider before it can run.',
		};
	}
	const free = operation.billing === 'free';
	const executable =
		(free || data.paymentsEnabled) &&
		operation.executable &&
		operation.state === 'certified';
	return {
		executable,
		label: executable ? (free ? 'Free' : 'Available') : 'Paused',
		reason: executable
			? free
				? 'Free service. Approve the input before it is sent to the provider. No wallet or payment is required.'
				: 'Reviewed operation. Your approval and spending limits still apply.'
			: operation.reason,
	};
}

export function masterkeyServiceStatus(
	agentId: string,
	data?: MasterkeyAvailability
) {
	if (!data || !data.ready) {
		return masterkeyOperationStatus(agentId, '', data);
	}
	const operations = data.operations.filter(
		op => op.serviceId === agentId.slice('masterkey:'.length)
	);
	return masterkeyOperationStatus(
		agentId,
		operations.find(op => op.executable)?.actionKey ??
			operations[0]?.actionKey ??
			'',
		data
	);
}

export function freeMasterkeyActionKeys(
	agentId: string,
	data?: MasterkeyAvailability
): string[] {
	if (!agentId.startsWith('masterkey:') || !data?.ready) return [];
	return data.operations
		.filter(
			op =>
				op.serviceId === agentId.slice('masterkey:'.length) &&
				op.billing === 'free' &&
				op.executable &&
				op.state === 'certified'
		)
		.map(op => op.actionKey);
}
