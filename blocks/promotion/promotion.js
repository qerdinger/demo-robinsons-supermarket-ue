import { buildPromotionCard } from '../../scripts/promotion-fragment.js';

/**
 * loads and decorates the promotion block: a single card built from the block's own fields,
 * which are either a static authored item (image/title/description/link) or, when a Content
 * Fragment reference is picked, fetched live from that fragment instead (see
 * buildPromotionCard). The fetch itself runs in the background so this block never blocks
 * the rest of the page.
 * @param {Element} block The promotion block element
 */
export default function decorate(block) {
  const card = buildPromotionCard([...block.children]);
  const ul = document.createElement('ul');
  ul.append(card);
  block.classList.add('promotions');
  block.replaceChildren(ul);
}
