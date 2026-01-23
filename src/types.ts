/**
 * Represents an individual link within a category
 */
export interface Link {
	label: string;
	url: string;
	description?: string;
}

/**
 * Represents a category of links displayed as a card
 */
export interface Category {
	name: string;
	kicker?: string;
	description?: string;
	accent?: string;
	cardWidth?: number;
	links?: Link[];
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
}
