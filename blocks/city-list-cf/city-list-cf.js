// dedicated persisted query returning one row per store with just its city field;
// duplicates across stores in the same city are expected and deduped below
const QUERY_PATH = 'Robinson/all-cities';

function renderCard(city) {
  const li = document.createElement('li');
  li.className = 'promotions-card';

  const link = document.createElement('a');
  link.className = 'promotions-card-link';
  link.href = `./stores?city=${encodeURIComponent(city)}`;

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
async function loadCards(ul, aemHost, headers) {
  let items = [];
  try {
    const res = await fetch(`${aemHost}/graphql/execute.json/${QUERY_PATH}`, { headers });
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    items = Object.values(json?.data || {})[0]?.items || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('city-list-cf: failed to load GraphQL data', error);
    return;
  }

  const cities = [...new Set(items.map((item) => item.city).filter(Boolean))];
  cities.forEach((city) => ul.append(renderCard(city)));
}

/**
 * loads and decorates the city-list-cf block: fetches the list of cities from a public
 * GraphQL persisted query (deduplicated client-side) and renders them as text-only cards.
 * The fetch itself runs in the background (see loadCards) so this block never blocks the
 * rest of the page.
 * @param {Element} block The city-list-cf block element
 */
export default function decorate(block) {
  const [aemHostDiv, accessTokenDiv] = block.children;
  const aemHost = aemHostDiv?.textContent.trim();
  const accessToken = accessTokenDiv?.textContent.trim();

  block.classList.add('promotions', 'style-title-only');
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  if (!aemHost) return;

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  loadCards(ul, aemHost, headers);
}
