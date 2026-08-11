// the author host requires the access token below; same-origin (no CORS needed) when this
// page is viewed inside Universal Editor's canvas, which also loads from this host
const AEM_HOST = 'https://author-p151412-e1619656.adobeaemcloud.com';

function trimBlurb(text, maxLength = 160) {
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

// plain <img> tags can't carry the Authorization header, so once the page is published
// (viewed without an authenticated author session cookie) a direct <img src> to the author
// host 401s; fetching the binary with the same header and pointing <img> at a blob URL works
// in both cases
async function fetchAuthenticatedImageUrl(url, headers) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

async function renderCard(item, headers) {
  const li = document.createElement('li');
  li.className = 'promotions-card';

  const link = document.createElement('div');
  link.className = 'promotions-card-link';

  // GraphQL's Content Fragment schema names these fields with a leading underscore
  // eslint-disable-next-line no-underscore-dangle
  const imagePath = item.featuredImage?._dynamicUrl || item.featuredImage?._path;
  if (imagePath) {
    const imageUrl = imagePath.startsWith('/') ? `${AEM_HOST}${imagePath}` : imagePath;
    const blobUrl = await fetchAuthenticatedImageUrl(imageUrl, headers);
    if (blobUrl) {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'promotions-card-image';
      const img = document.createElement('img');
      img.src = blobUrl;
      img.alt = item.title || '';
      img.loading = 'lazy';
      imageWrapper.append(img);
      link.append(imageWrapper);
    }
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
  const [queryPathDiv, accessTokenDiv] = block.children;
  const queryPath = queryPathDiv?.textContent.trim();
  const accessToken = accessTokenDiv?.textContent.trim();

  block.classList.add('promotions');
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  if (!queryPath) return;

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  let items = [];
  try {
    const res = await fetch(`${AEM_HOST}/graphql/execute.json/${queryPath}`, { headers });
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    items = Object.values(json?.data || {})[0]?.items || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('promotions-cf: failed to load GraphQL data', error);
    return;
  }

  const cards = await Promise.all(items.map((item) => renderCard(item, headers)));
  cards.forEach((li) => ul.append(li));
}
