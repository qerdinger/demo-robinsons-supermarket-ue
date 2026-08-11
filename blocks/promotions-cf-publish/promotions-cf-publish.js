import { createOptimizedPicture } from '../../scripts/aem.js';

function trimBlurb(text, maxLength = 160) {
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

function renderCard(item, aemHost) {
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
    const imageUrl = imagePath.startsWith('/') ? `${aemHost}${imagePath}` : imagePath;
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
 * loads and decorates the promotions-cf-publish block: fetches its cards from a public
 * GraphQL persisted query on the publish/delivery tier, anonymously (no access token)
 * @param {Element} block The promotions-cf-publish block element
 */
export default async function decorate(block) {
  const [aemHostDiv, queryPathDiv] = block.children;
  const aemHost = aemHostDiv?.textContent.trim();
  const queryPath = queryPathDiv?.textContent.trim();

  block.classList.add('promotions');
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  if (!aemHost || !queryPath) return;

  let items = [];
  try {
    const res = await fetch(`${aemHost}/graphql/execute.json/${queryPath}`);
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    items = Object.values(json?.data || {})[0]?.items || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('promotions-cf-publish: failed to load GraphQL data', error);
    return;
  }

  items.forEach((item) => ul.append(renderCard(item, aemHost)));
}
