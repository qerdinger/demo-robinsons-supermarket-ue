import { moveInstrumentation } from '../../scripts/scripts.js';

function mapUrl(address) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function addParagraph(parent, className, text) {
  if (!text) return;
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  parent.append(p);
}

/**
 * loads and decorates the store locator
 * @param {Element} block The store locator block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const panel = document.createElement('div');
  panel.className = 'store-locator-panel';

  const search = document.createElement('div');
  search.className = 'store-locator-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Enter Your Location';
  const searchIcon = document.createElement('span');
  searchIcon.className = 'store-locator-search-icon';
  search.append(searchInput, searchIcon);

  const list = document.createElement('ul');
  list.className = 'store-locator-list';

  const iframe = document.createElement('iframe');
  iframe.title = 'Store map';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';

  rows.forEach((row, i) => {
    const [nameDiv, addressDiv, hoursDiv, phoneDiv] = row.children;
    const name = nameDiv?.textContent.trim();
    const address = addressDiv?.textContent.trim();
    const hours = hoursDiv?.textContent.trim();
    const phone = phoneDiv?.textContent.trim();

    const li = document.createElement('li');
    li.className = 'store-locator-item';
    moveInstrumentation(row, li);

    const nameEl = document.createElement('p');
    nameEl.className = 'store-locator-name';
    const pin = document.createElement('span');
    pin.className = 'store-locator-pin';
    pin.textContent = '📍';
    nameEl.append(pin, document.createTextNode(name || ''));
    li.append(nameEl);

    addParagraph(li, 'store-locator-address', address);
    if (hours) addParagraph(li, 'store-locator-hours-label', 'Store Hours');
    addParagraph(li, 'store-locator-hours', hours);
    if (phone) addParagraph(li, 'store-locator-phone', `Tel No.: ${phone}`);

    li.addEventListener('click', () => {
      [...list.children].forEach((item) => item.classList.remove('active'));
      li.classList.add('active');
      iframe.src = mapUrl(address || name);
    });

    if (i === 0) {
      li.classList.add('active');
      iframe.src = mapUrl(address || name);
    }

    list.append(li);
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    [...list.children].forEach((item) => {
      const matches = item.textContent.toLowerCase().includes(query);
      item.classList.toggle('is-hidden', !matches);
    });
  });

  panel.append(search, list);

  const map = document.createElement('div');
  map.className = 'store-locator-map';
  map.append(iframe);

  block.replaceChildren(panel, map);
}
