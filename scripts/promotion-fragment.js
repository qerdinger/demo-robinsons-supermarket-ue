// the promotion-by-path persisted query filters by the fragment's DAM path server-side, so
// this always resolves to exactly the matching item (no client-side filtering needed). The
// path itself comes from a Universal Editor content-reference picker rather than a
// hand-typed slug, so it's always valid at the time it's authored.
const QUERY_PATH = 'Robinson/promotion-by-path';

function trimBlurb(text, maxLength = 160) {
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

/**
 * extracts a DAM path from an "aem-content" field's rendered <a>, matching the same
 * convention blocks/fragment/fragment.js uses for its own aem-content field: read the href
 * attribute (not the link text, whose content isn't guaranteed the same way "reference"
 * fields' text is) and strip AEM's appended ".html"/".plain.html" suffix.
 * @param {HTMLAnchorElement} [anchor] the field's rendered link, if any
 * @returns {string|null} the clean DAM path, or null if there's no link
 */
export function extractFragmentPath(anchor) {
  if (!anchor) return null;
  return anchor.getAttribute('href')?.replace(/(\.plain)?\.html$/, '') || null;
}

/**
 * fetches a single Promotions content fragment item by its DAM path
 * @param {string} aemHost the AEM host to fetch the persisted query from
 * @param {string} fragmentPath the fragment's absolute DAM path (e.g. picked via a
 * Universal Editor reference field)
 * @returns {Promise<object|null>} the matching item, or null if not found
 */
export async function fetchPromotionByPath(aemHost, fragmentPath) {
  const url = `${aemHost}/graphql/execute.json/${QUERY_PATH};promotionPath=${encodeURIComponent(fragmentPath)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    return Object.values(json?.data || {})[0]?.item || null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`promotion-fragment: failed to load path "${fragmentPath}"`, error);
    return null;
  }
}

/**
 * renders a Promotions content fragment item using the same .promotions-card markup shared
 * by the promotion, promotions, city-list and stores-by-city blocks
 * @param {object} item the content fragment item ({ title, main, featuredImage })
 * @param {string} aemHost the AEM host, used to resolve relative image paths
 * @param {string} [style] optional "style-<value>" modifier class for this card
 * @param {string} [href] optional link URL — the fragment itself has no URL field, so the
 * whole card is only clickable when the author supplies one alongside the fragment reference
 * @returns {HTMLLIElement} the rendered card
 */
export function renderPromotionCard(item, aemHost, style, href) {
  const li = document.createElement('li');
  li.className = 'promotions-card';
  if (style && style !== 'default') li.classList.add(`style-${style}`);

  const link = href ? document.createElement('a') : document.createElement('div');
  if (href) link.href = href;
  link.className = 'promotions-card-link';

  // GraphQL's Content Fragment schema names these fields with a leading underscore
  // eslint-disable-next-line no-underscore-dangle
  const imagePath = item.featuredImage?._dynamicUrl || item.featuredImage?._path;
  if (imagePath) {
    const imageUrl = imagePath.startsWith('/') ? `${aemHost}${imagePath}` : imagePath;
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'promotions-card-image';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = item.title || '';
    img.loading = 'lazy';
    imageWrapper.append(img);
    link.append(imageWrapper);
  }

  const body = document.createElement('div');
  body.className = 'promotions-card-body';
  if (item.title) {
    const titleEl = document.createElement('p');
    titleEl.className = 'promotions-card-title';
    titleEl.textContent = item.title;
    body.append(titleEl);
  }
  if (item.main?.plaintext) {
    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'promotions-card-description';
    descriptionEl.textContent = trimBlurb(item.main.plaintext);
    body.append(descriptionEl);
  }
  link.append(body);
  li.append(link);
  return li;
}
