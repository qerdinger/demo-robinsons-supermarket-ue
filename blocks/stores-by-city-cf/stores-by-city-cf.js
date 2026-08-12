const QUERY_PATH = 'Robinson/stores-by-city';

// the pin-locator icon lives in the DAM (imported from robinsonssupermarket.com.ph); its
// dynamic-media delivery path is the same on the author and publish tiers, only the host
// differs, so it's prefixed with whichever aemHost the block is configured with
const PIN_ICON_PATH = '/adobe/dynamicmedia/deliver/dm-aid--cdd654d7-d999-456a-9761-2a1f6de5b006/pin-locator.webp';

function renderCard(item, aemHost) {
  const li = document.createElement('li');
  li.className = 'stores-by-city-cf-card';

  const header = document.createElement('div');
  header.className = 'stores-by-city-cf-card-header';
  const pin = document.createElement('img');
  pin.className = 'stores-by-city-cf-pin';
  pin.src = `${aemHost}${PIN_ICON_PATH}`;
  pin.alt = '';
  pin.loading = 'lazy';
  header.append(pin);
  if (item.storeName) {
    const nameEl = document.createElement('p');
    nameEl.className = 'stores-by-city-cf-name';
    nameEl.textContent = item.storeName;
    header.append(nameEl);
  }
  li.append(header);

  if (item.storeAddress) {
    const addressEl = document.createElement('p');
    addressEl.className = 'stores-by-city-cf-address';
    addressEl.textContent = item.storeAddress;
    li.append(addressEl);
  }
  if (item.storeHours?.plaintext) {
    const hoursLabelEl = document.createElement('p');
    hoursLabelEl.className = 'stores-by-city-cf-hours-label';
    hoursLabelEl.textContent = 'Store Hours';
    li.append(hoursLabelEl);

    const hoursEl = document.createElement('p');
    hoursEl.className = 'stores-by-city-cf-hours';
    hoursEl.textContent = item.storeHours.plaintext;
    li.append(hoursEl);
  }
  if (item.storePhone) {
    const phoneEl = document.createElement('p');
    phoneEl.className = 'stores-by-city-cf-phone';
    phoneEl.textContent = `Tel No.: ${item.storePhone}`;
    li.append(phoneEl);
  }

  return li;
}

// the stores-by-city persisted query needs its city variable posted in the request body —
// passing it as a `;city=...` URL segment (the GET-style syntax used elsewhere in this
// project) silently returns an empty result whenever the value contains a space, which
// every city name here does
async function loadCards(ul, aemHost, city, headers) {
  let items = [];
  try {
    const res = await fetch(`${aemHost}/graphql/execute.json/${QUERY_PATH}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: { city } }),
    });
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    items = Object.values(json?.data || {})[0]?.items || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('stores-by-city-cf: failed to load GraphQL data', error);
    return;
  }

  items.forEach((item) => ul.append(renderCard(item, aemHost)));
}

/**
 * loads and decorates the stores-by-city-cf block: reads the "city" query parameter from
 * the current page URL and fetches every store in that city from a public GraphQL
 * persisted query. The fetch itself runs in the background (see loadCards) so this block
 * never blocks the rest of the page.
 * @param {Element} block The stores-by-city-cf block element
 */
export default function decorate(block) {
  const [aemHostDiv, accessTokenDiv] = block.children;
  const aemHost = aemHostDiv?.textContent.trim();
  const accessToken = accessTokenDiv?.textContent.trim();
  const city = new URLSearchParams(window.location.search).get('city');

  const backLink = document.createElement('a');
  backLink.className = 'stores-by-city-cf-back';
  backLink.href = '../';
  backLink.textContent = '← Back to Store Directory';

  const heading = document.createElement('h1');
  heading.className = 'stores-by-city-cf-heading';
  heading.textContent = city || 'Stores';

  const ul = document.createElement('ul');
  ul.className = 'stores-by-city-cf-list';
  block.replaceChildren(backLink, heading, ul);

  if (!aemHost || !city) return;

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  loadCards(ul, aemHost, city, headers);
}
