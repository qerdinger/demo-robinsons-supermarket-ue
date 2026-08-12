import getGraphqlHost from '../../scripts/graphql-host.js';

function trimBlurb(text, maxLength = 160) {
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

// renders the fetched item using the same .promotions-card markup as the promotions/
// promotions-cf blocks, so a promotion block looks and behaves identically
function renderCard(item, aemHost) {
  const li = document.createElement('li');
  li.className = 'promotions-card';

  const link = document.createElement('div');
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

// the promotion-by-slug persisted query filters by slug server-side, so this always
// resolves to exactly the one matching item (no client-side filtering needed)
const QUERY_PATH = 'Robinson/promotion-by-slug';

// fetches the persisted query for the given slug and appends the resulting card to the
// block. Not awaited by decorate(), so it never blocks the rest of the page's sections/blocks
// from loading while the network requests are in flight (see loadSections/loadSection in
// scripts/aem.js, which await each section/block in sequence).
async function loadCard(ul, aemHost, slug) {
  const url = `${aemHost}/graphql/execute.json/${QUERY_PATH};slug=${encodeURIComponent(slug)}`;
  let items = [];
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    items = Object.values(json?.data || {})[0]?.items || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('promotion: failed to load GraphQL data', error);
    return;
  }

  const [item] = items;
  if (!item) {
    // eslint-disable-next-line no-console
    console.error(`promotion: no item found with slug "${slug}"`);
    return;
  }

  ul.append(renderCard(item, aemHost));
}

/**
 * loads and decorates the promotion block: fetches a single card from a public GraphQL
 * persisted query, matched by its slug, instead of authored block items. The fetch itself
 * runs in the background (see loadCard) so this block never blocks the rest of the page.
 * @param {Element} block The promotion block element
 */
export default function decorate(block) {
  const [slugDiv, styleDiv] = block.children;
  const slug = slugDiv?.textContent.trim();
  const style = styleDiv?.textContent.trim();

  block.classList.add('promotions');
  if (style && style !== 'default') block.classList.add(`style-${style}`);
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  if (!slug) return;

  loadCard(ul, getGraphqlHost(), slug);
}
