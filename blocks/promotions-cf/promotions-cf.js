import { createOptimizedPicture } from '../../scripts/aem.js';

// the persisted GraphQL query is public on the delivery/publish tier, not the author host
const AEM_HOST = 'https://publish-p151412-e1619656.adobeaemcloud.com';

function trimBlurb(text, maxLength = 160) {
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

function renderCard(item) {
  const li = document.createElement('li');
  li.className = 'promotions-card';

  const link = document.createElement('div');
  link.className = 'promotions-card-link';

  // GraphQL's Content Fragment schema names these fields with a leading underscore
  // eslint-disable-next-line no-underscore-dangle
  const imagePath = item.featuredImage?._dynamicUrl || item.featuredImage?._path;
  if (imagePath) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'promotions-card-image';
    const imageUrl = imagePath.startsWith('/') ? `${AEM_HOST}${imagePath}` : imagePath;
    const optimizedPic = createOptimizedPicture(imageUrl, item.title || '', false, [{ width: '750' }]);
    imageWrapper.append(optimizedPic);
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

/**
 * loads and decorates the promotions-cf block: fetches its cards from a public
 * GraphQL persisted query instead of authored block items
 * @param {Element} block The promotions-cf block element
 */
export default async function decorate(block) {
  const [queryPathDiv] = block.children;
  const queryPath = queryPathDiv?.textContent.trim();

  block.classList.add('promotions');
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  if (!queryPath) return;

  let items = [];
  try {
    const res = await fetch(`${AEM_HOST}/graphql/execute.json/${queryPath}`);
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    items = Object.values(json?.data || {})[0]?.items || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('promotions-cf: failed to load GraphQL data', error);
    return;
  }

  items.forEach((item) => ul.append(renderCard(item)));
}
