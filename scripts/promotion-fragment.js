// the promotion-by-slug persisted query filters by slug server-side, so this always
// resolves to exactly the one matching item (no client-side filtering needed)
const QUERY_PATH = 'Robinson/promotion-by-slug';

function trimBlurb(text, maxLength = 160) {
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

/**
 * fetches a single Promotions content fragment item by its "slug" field
 * @param {string} aemHost the AEM host to fetch the persisted query from
 * @param {string} slug the fragment's "slug" field value to match
 * @returns {Promise<object|null>} the matching item, or null if not found
 */
export async function fetchPromotionBySlug(aemHost, slug) {
  const url = `${aemHost}/graphql/execute.json/${QUERY_PATH};slug=${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    const items = Object.values(json?.data || {})[0]?.items || [];
    return items[0] || null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`promotion-fragment: failed to load slug "${slug}"`, error);
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
 * whole card is only clickable when the author supplies one alongside the slug
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
