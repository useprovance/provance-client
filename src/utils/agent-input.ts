import { isInputObject, parseServiceInput } from './service-input.ts';

/** Read old saved service nodes without rewriting them until the user saves. */
export function agentParameterJson(
	config: Record<string, unknown>,
	managed: boolean
): string {
	const params = isInputObject(config.parameters) ? config.parameters : {};
	return managed &&
		config.__inputVersion !== 2 &&
		Object.hasOwn(params, 'inputJson')
		? String(params.inputJson ?? '{}')
		: JSON.stringify(params, null, 2);
}

export function agentInputSettings(
	config: Record<string, unknown>,
	managed: boolean
): Record<string, unknown> {
	const settings = isInputObject(config.settings) ? config.settings : {};
	const params = isInputObject(config.parameters) ? config.parameters : {};
	return managed &&
		config.__inputVersion !== 2 &&
		Object.hasOwn(params, 'maxFeeUsd')
		? { ...settings, maxFeeUsd: params.maxFeeUsd }
		: { ...settings };
}

export function saveAgentParameters(
	config: Record<string, unknown>,
	json: string,
	managed: boolean,
	editedSettings?: Record<string, unknown>
): Record<string, unknown> {
	const parameters = parseServiceInput(json);
	const links = isInputObject(config.__links)
		? { ...config.__links }
		: undefined;
	// Saving named fields replaces the old whole-body mapping, while individual field links remain.
	if (managed && config.__inputVersion !== 2 && links) {
		delete links.inputJson;
	}
	return {
		...config,
		parameters,
		...(links ? { __links: links } : {}),
		...(managed
			? {
					settings: editedSettings ?? agentInputSettings(config, true),
					__inputVersion: 2,
				}
			: {}),
	};
}
