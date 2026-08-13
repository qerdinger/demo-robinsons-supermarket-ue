import { createOptimizedPicture } from './aem.js';
import { moveInstrumentation } from './scripts.js';
import getGraphqlHost from './graphql-host.js';

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
 * fetches a single Promotions content fragment item by its DAM path
 * @param {string} aemHost the AEM host to fetch the persisted query from
 * @param {string} fragmentPath the fragment's absolute DAM path (e.g. picked via a
 * Universal Editor reference field)
 * @returns {Promise<object|null>} the matching item, or null if not found
 */
export async function fetchPromotionByPath(aemHost, fragmentPath) {
  // deliberately NOT url-encoded: AEM's persisted-query matrix-parameter parsing doesn't
  // decode "%2F" back to "/" for this value, so encodeURIComponent would mangle the path
  // into something the server reports as "no resource available" — the literal path with
  // real slashes is what this query expects
  const url = `${aemHost}/graphql/execute.json/${QUERY_PATH};promotionPath=${fragmentPath}`;
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

// fetches a CF item by its fragment path and fills the placeholder card in once it arrives.
// Updates the placeholder's own class/content in place rather than replacing the element
// outright — a caller may have attached Universal Editor's data-aue-* markers to the
// placeholder itself (see moveInstrumentation in buildPromotionCard below), and swapping in
// a brand-new element here would silently drop them, making the item unselectable/invisible
// in the editor. Not awaited by the caller, so a CF-backed card never blocks the rest of the
// page's sections from loading (see loadSections/loadSection in scripts/aem.js, which await
// each section/block in sequence).
async function loadCfCard(placeholder, fragmentPath, style, href) {
  const aemHost = getGraphqlHost();
  const item = await fetchPromotionByPath(aemHost, fragmentPath);
  if (!item) return;
  const card = renderPromotionCard(item, aemHost, style, href);
  placeholder.className = card.className;
  placeholder.replaceChildren(...card.childNodes);
}

/**
 * builds one promotion card from a "promotion" model's field divs — shared by the promotion
 * block (a single instance's own children) and the promotions block (one row's children per
 * authored item), since both use the exact same field set. Each set of fields is either a
 * static authored item (image/title/description/link) or, when a Content Fragment reference
 * is picked, fetched live from that fragment instead (fired in the background, not awaited
 * here — see loadCfCard).
 * @param {Element[]} fields the field divs, in [image, title, description, linkHref,
 * fragmentPath, style] order (imageAlt has no div of its own — AEM merges it into the
 * image div's <img alt> instead)
 * @param {Element} [instrumentationSource] when rendering one row of a list (as opposed to
 * a standalone block's own children), the authored row element to move Universal Editor's
 * editing instrumentation from, so the row stays individually selectable/editable
 * @returns {HTMLLIElement} the rendered (or not-yet-filled) <li class="promotions-card">
 */
export function buildPromotionCard(fields, instrumentationSource) {
  const [imageDiv, titleDiv, descriptionDiv, linkDiv, fragmentPathDiv, styleDiv] = fields;
  const fragmentPath = fragmentPathDiv?.textContent.trim();
  const style = styleDiv?.textContent.trim();
  const link = linkDiv?.querySelector('a');
  const href = link ? link.href : linkDiv?.textContent.trim();

  const li = document.createElement('li');
  li.className = 'promotions-card';
  if (instrumentationSource) moveInstrumentation(instrumentationSource, li);

  if (fragmentPath) {
    loadCfCard(li, fragmentPath, style, href);
    return li;
  }

  if (style && style !== 'default') li.classList.add(`style-${style}`);

  const picture = imageDiv?.querySelector('picture');
  const title = titleDiv?.textContent.trim();
  const description = descriptionDiv?.textContent.trim();

  const container = href ? document.createElement('a') : document.createElement('div');
  if (href) container.href = href;
  container.className = 'promotions-card-link';

  if (picture) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'promotions-card-image';
    const img = picture.querySelector('img');
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    imageWrapper.append(optimizedPic);
    container.append(imageWrapper);
  }

  const body = document.createElement('div');
  body.className = 'promotions-card-body';
  if (title) {
    const titleEl = document.createElement('p');
    titleEl.className = 'promotions-card-title';
    titleEl.textContent = title;
    body.append(titleEl);
  }
  if (description) {
    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'promotions-card-description';
    descriptionEl.textContent = description;
    body.append(descriptionEl);
  }
  container.append(body);
  li.append(container);
  return li;
}
