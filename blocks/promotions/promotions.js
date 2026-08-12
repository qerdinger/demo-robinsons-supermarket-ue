import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import getGraphqlHost from '../../scripts/graphql-host.js';
import { fetchPromotionBySlug, renderPromotionCard } from '../../scripts/promotion-fragment.js';

// fetches a CF item by slug and fills the placeholder card in once it arrives. Updates the
// placeholder's own class/content in place rather than replacing the element outright —
// moveInstrumentation (below) attaches Universal Editor's data-aue-* markers to the
// placeholder itself, so swapping in a brand-new element here would silently drop them,
// making the item unselectable/invisible in the editor. Not awaited by decorate(), so a
// slug-backed row never blocks the rest of the page's sections from loading (see
// loadSections/loadSection in scripts/aem.js, which await each section/block in sequence).
async function loadCfCard(placeholder, slug, style, href) {
  const aemHost = getGraphqlHost();
  const item = await fetchPromotionBySlug(aemHost, slug);
  if (!item) return;
  const card = renderPromotionCard(item, aemHost, style, href);
  placeholder.className = card.className;
  placeholder.replaceChildren(...card.childNodes);
}

/**
 * loads and decorates the promotions block. Each authored row is either a static item
 * (image/title/description/link) or, when a "slug" is set, fetched live from a Content
 * Fragment matching that slug (see loadCfCard) — the same query used by the promotion block.
 * @param {Element} block The promotions block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    // note: the model's imageAlt field is merged by AEM into <img alt>, not rendered as its own div
    const [imageDiv, titleDiv, descriptionDiv, linkDiv, slugDiv, styleDiv] = row.children;
    const slug = slugDiv?.textContent.trim();
    const style = styleDiv?.textContent.trim();
    const link = linkDiv?.querySelector('a');
    const href = link ? link.href : linkDiv?.textContent.trim();

    if (slug) {
      const placeholder = document.createElement('li');
      placeholder.className = 'promotions-card';
      moveInstrumentation(row, placeholder);
      ul.append(placeholder);
      loadCfCard(placeholder, slug, style, href);
      return;
    }

    const picture = imageDiv?.querySelector('picture');
    const title = titleDiv?.textContent.trim();
    const description = descriptionDiv?.textContent.trim();

    const li = document.createElement('li');
    li.className = 'promotions-card';
    if (style && style !== 'default') li.classList.add(`style-${style}`);
    moveInstrumentation(row, li);

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
    ul.append(li);
  });

  block.replaceChildren(ul);
}
