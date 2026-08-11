import { toCamelCase } from './aem.js';

/**
 * True when running against an AEM author origin (Universal Editor / preview).
 */
export function isAuthorEnvironment() {
  return Boolean(window?.location?.origin?.includes('author'));
}

const placeholderPromises = {};

/**
 * Loads and caches /placeholders.json (Key -> Text, keys normalized to camelCase).
 * @param {string} [prefix]
 * @returns {Promise<Record<string, string>>}
 */
export async function fetchPlaceholders(prefix = 'default') {
  const cacheKey = prefix === 'default' ? 'default' : prefix;
  if (!placeholderPromises[cacheKey]) {
    placeholderPromises[cacheKey] = (async () => {
      try {
        const path = prefix === 'default'
          ? '/placeholders.json'
          : `/${String(prefix).replace(/^\//, '')}/placeholders.json`;
        const resp = await fetch(path);
        if (!resp.ok) return {};
        const json = await resp.json();
        const placeholders = {};
        json.data
          ?.filter((row) => row.Key)
          .forEach((row) => {
            placeholders[toCamelCase(row.Key)] = row.Text;
          });
        return placeholders;
      } catch {
        return {};
      }
    })();
  }
  return placeholderPromises[cacheKey];
}
