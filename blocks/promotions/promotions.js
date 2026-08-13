import { buildPromotionCard } from '../../scripts/promotion-fragment.js';

/**
 * loads and decorates the promotions block: one card per authored "Promotion" item, each
 * either a static authored item (image/title/description/link) or, when a Content Fragment
 * reference is picked, fetched live from that fragment instead (see buildPromotionCard).
 * @param {Element} block The promotions block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const card = buildPromotionCard([...row.children], row);
    if (card) ul.append(card);
  });
  block.replaceChildren(ul);
}
