import getGraphqlHost from '../../scripts/graphql-host.js';
import { fetchPromotionBySlug, renderPromotionCard } from '../../scripts/promotion-fragment.js';

// fetches the persisted query for the given slug and appends the resulting card to the
// block. Not awaited by decorate(), so it never blocks the rest of the page's sections/blocks
// from loading while the network requests are in flight (see loadSections/loadSection in
// scripts/aem.js, which await each section/block in sequence).
async function loadCard(ul, aemHost, slug, style) {
  const item = await fetchPromotionBySlug(aemHost, slug);
  if (!item) return;
  ul.append(renderPromotionCard(item, aemHost, style));
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
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  if (!slug) return;

  loadCard(ul, getGraphqlHost(), slug, style);
}
