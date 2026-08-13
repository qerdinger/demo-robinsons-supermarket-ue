import getGraphqlHost from '../../scripts/graphql-host.js';
import { fetchPromotionByPath, renderPromotionCard } from '../../scripts/promotion-fragment.js';

// fetches the persisted query for the given fragment path and appends the resulting card to
// the block. Not awaited by decorate(), so it never blocks the rest of the page's
// sections/blocks from loading while the network requests are in flight (see
// loadSections/loadSection in scripts/aem.js, which await each section/block in sequence).
async function loadCard(ul, aemHost, fragmentPath, style) {
  const item = await fetchPromotionByPath(aemHost, fragmentPath);
  if (!item) return;
  ul.append(renderPromotionCard(item, aemHost, style));
}

/**
 * loads and decorates the promotion block: fetches a single card from a public GraphQL
 * persisted query, matched by a Content Fragment reference picked in Universal Editor,
 * instead of authored block items. The fetch itself runs in the background (see loadCard)
 * so this block never blocks the rest of the page.
 * @param {Element} block The promotion block element
 */
export default function decorate(block) {
  const [fragmentPathDiv, styleDiv] = block.children;
  // the "reference" field renders as <a href="/content/dam/....html">/content/dam/...</a> —
  // AEM appends a stray ".html" to the href but not to the link text, so read the text
  // content for the clean DAM path rather than the href (which is also, separately, not
  // usable as-is: it'd resolve to an absolute URL against the current page's own origin)
  const fragmentPath = fragmentPathDiv?.querySelector('a')?.textContent.trim();
  const style = styleDiv?.textContent.trim();

  block.classList.add('promotions');
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  if (!fragmentPath) return;

  loadCard(ul, getGraphqlHost(), fragmentPath, style);
}
