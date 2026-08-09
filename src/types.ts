/**
 * Values substituted into `{{token}}` placeholders in link URLs
 */
export type Vars = Record<string, string | number>;

/**
 * A named variant definition — the same link in a different form (an
 * environment, a region, an API version). Declared at the root or on a card
 * under `variantDefs`, then selected by name via `variants`.
 */
export interface VariantDef {
	label?: string;
	color?: string;
	url?: string;
	title?: string;
	vars?: Vars;
}

/**
 * How a link asks for a variant: either a bare name referencing a definition,
 * or an object that references one and/or supplies its own fields inline
 */
export type VariantRef = string | ({ ref?: string } & VariantDef);

/**
 * A variant after definitions, overrides, and vars have been resolved
 */
export interface ResolvedVariant {
	label: string;
	url: string;
	color?: string;
	title?: string;
}

/**
 * Represents an individual link within a category. `url` is the template every
 * variant resolves against, and is optional only when each variant carries its
 * own url.
 */
export interface Link {
	label: string;
	url?: string;
	description?: string;
	variants?: VariantRef[];
}

/**
 * Represents a category of links displayed as a card
 */
export interface Category {
	name?: string;
	kicker?: string;
	description?: string;
	accent?: string;
	cols?: number;
	links?: Link[];
	children?: Category[];
	transparent?: boolean;
	background?: string;
	vars?: Vars;
	variantDefs?: Record<string, VariantDef>;
	variants?: VariantRef[];
}

/**
 * Hero section configuration
 */
export interface Hero {
	kicker?: string;
	title?: string;
	description?: string;
}

/**
 * Root data structure for links.yaml
 */
export interface LinkData {
	hero?: Hero;
	categories?: Category[];
	variantDefs?: Record<string, VariantDef>;
}
