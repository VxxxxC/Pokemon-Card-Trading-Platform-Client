/** Grid page size — shared by SSR bootstrap and client pagination (avoids hydration refetch). */
export const MARKETPLACE_GRID_PAGE_SIZE = 12;

/** Storefront grid — no pagination UI yet; fetch up to max page size per search. */
export const MARKETPLACE_STOREFRONT_PAGE_SIZE = 50;

/** TTL for cached filter metadata (price bounds, rarities). */
export const MARKETPLACE_FILTER_CACHE_SECONDS = 900;

/** TTL for default unfiltered browse search (page 1, latest). */
export const MARKETPLACE_SEARCH_CACHE_SECONDS = 60;

/** TTL for product catalog detail (stable reference data). */
export const MARKETPLACE_PRODUCT_CATALOG_CACHE_SECONDS = 900;

/** TTL for cached product market prices (cron-refreshed). */
export const MARKETPLACE_PRODUCT_MARKET_PRICES_CACHE_SECONDS = 60;

/** TTL for default product detail order book (page 1, price asc, no filters). */
export const MARKETPLACE_PRODUCT_DEFAULT_LISTINGS_CACHE_SECONDS = 60;
