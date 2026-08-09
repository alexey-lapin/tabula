import type { Link, ResolvedVariant, VariantDef, VariantRef, Vars } from './types.ts';

const TOKEN = /\{\{\s*([A-Za-z0-9_-]+)\s*\}\}/g;

/**
 * Substitutes `{{token}}` placeholders with values from vars. Unknown tokens
 * are left untouched so a typo is visible in the rendered URL.
 */
export function interpolate(template: string, vars: Vars): string {
	return template.replace(TOKEN, (match, key) => {
		const value = vars[key];
		return value === undefined ? match : String(value);
	});
}

/**
 * Merges a card's variant definitions over the ones it inherited. Definitions
 * merge field by field, so a card can override just a color and keep the
 * inherited vars.
 */
export function mergeVariantDefs(
	inherited: Record<string, VariantDef>,
	own?: Record<string, VariantDef>,
): Record<string, VariantDef> {
	if (!own) return inherited;

	const merged = { ...inherited };
	for (const [name, def] of Object.entries(own)) {
		const base = inherited[name];
		merged[name] = {
			...base,
			...def,
			vars: { ...(base?.vars ?? {}), ...(def?.vars ?? {}) },
		};
	}
	return merged;
}

/**
 * Resolves the variants a link should render. A link's own selection replaces
 * the card's outright, which is what makes "every service but this one has a
 * UAT" read cleanly. Returns an empty list for a plain link.
 */
export function resolveVariants(
	link: Link,
	defs: Record<string, VariantDef>,
	cardVariants: VariantRef[] | undefined,
	vars: Vars,
): ResolvedVariant[] {
	const selected = link.variants ?? cardVariants ?? [];

	return selected.map((entry) => {
		const ref = typeof entry === 'string' ? { ref: entry } : entry;
		const def = ref.ref === undefined ? undefined : defs[ref.ref];

		if (ref.ref !== undefined && !def) {
			throw new Error(
				`Link "${link.label}" references unknown variant "${ref.ref}". ` +
					`Known variants: ${Object.keys(defs).join(', ') || '(none)'}`,
			);
		}

		const label = ref.label ?? def?.label ?? ref.ref;
		if (!label) {
			throw new Error(`Link "${link.label}" has a variant with neither a ref nor a label`);
		}

		const template = ref.url ?? def?.url ?? link.url;
		if (!template) {
			throw new Error(`Link "${link.label}" variant "${label}" has no url to resolve`);
		}

		return {
			label,
			url: interpolate(template, { ...vars, ...(def?.vars ?? {}), ...(ref.vars ?? {}) }),
			color: ref.color ?? def?.color,
			title: ref.title ?? def?.title,
		};
	});
}
