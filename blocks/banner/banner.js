import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the banner
 * @param {Element} block The banner block element
 */
export default function decorate(block) {
  const [row] = block.children;
  // note: the model's imageAlt field is merged by AEM into <img alt>, not rendered as its own div
  const [imageDiv, linkDiv, paddingDiv] = row.children;
  const picture = imageDiv?.querySelector('picture');
  const link = linkDiv?.querySelector('a');
  const href = link ? link.href : linkDiv?.textContent.trim();
  const padding = paddingDiv?.textContent.trim();

  block.classList.toggle('no-padding', padding === 'without-padding');

  if (!picture) return;

  const img = picture.querySelector('img');
  const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '1600' }]);
  moveInstrumentation(img, optimizedPic.querySelector('img'));

  const container = href ? document.createElement('a') : document.createElement('div');
  if (href) container.href = href;
  moveInstrumentation(row, container);
  container.append(optimizedPic);

  block.replaceChildren(container);
}
