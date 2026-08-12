import getGraphqlHost, { isAuthorEnvironment } from '../../scripts/graphql-host.js';

// dedicated persisted query returning one row per store with just its city field;
// duplicates across stores in the same city are expected and deduped below
const QUERY_PATH = 'Robinson/all-cities';

// the current document URL commonly ends in a filename-like segment (e.g. "store-locator.html"
// on the author host, or an extension-less "/store-locator" on the published site) rather than
// a trailing slash, so a plain relative "./stores" link resolves one level too high (against
// the URL's parent directory) instead of into a "store-locator/stores" sibling page — build the
// target path explicitly off the current page's own path instead of relying on that resolution.
// The ".html" extension itself is only needed (and only served) on the author instance —
// the published site uses clean, extension-less paths.
function storesPageHref(city) {
  const base = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const extension = isAuthorEnvironment() ? '.html' : '';
  return `${base}/stores${extension}?city=${encodeURIComponent(city)}`;
}

function renderCard(city) {
  const li = document.createElement('li');
  li.className = 'promotions-card style-title-only';

  const link = document.createElement('a');
  link.className = 'promotions-card-link';
  link.href = storesPageHref(city);

  const body = document.createElement('div');
  body.className = 'promotions-card-body';
  const titleEl = document.createElement('p');
  titleEl.className = 'promotions-card-title';
  titleEl.textContent = city;
  body.append(titleEl);

  link.append(body);
  li.append(link);
  return li;
}

// fetches and renders the city cards in the background; deliberately not awaited by
// decorate() so this block's network round-trip never blocks the rest of the page's
// sections from loading (see loadSections/loadSection in scripts/aem.js, which await
// each section/block in sequence)
async function loadCards(ul, aemHost) {
  let items = [];
  try {
    const res = await fetch(`${aemHost}/graphql/execute.json/${QUERY_PATH}`);
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    items = Object.values(json?.data || {})[0]?.items || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('city-list: failed to load GraphQL data', error);
    return;
  }

  const cities = [...new Set(items.map((item) => item.city).filter(Boolean))];
  cities.forEach((city) => ul.append(renderCard(city)));
}

/**
 * loads and decorates the city-list block: fetches the list of cities from a public
 * GraphQL persisted query (deduplicated client-side) and renders them as text-only cards.
 * The fetch itself runs in the background (see loadCards) so this block never blocks the
 * rest of the page.
 * @param {Element} block The city-list block element
 */
export default function decorate(block) {
  block.classList.add('promotions');
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  loadCards(ul, getGraphqlHost());
}
