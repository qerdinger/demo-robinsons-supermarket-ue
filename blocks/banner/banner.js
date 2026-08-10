import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the banner
 * @param {Element} block The banner block element
 */
export default function decorate(block) {
  // a plain (non-repeating) block has one top-level div per field, not a wrapping row;
  // the model's imageAlt field is merged by AEM into <img alt>, not rendered as its own div
  const [imageDiv, linkDiv, paddingDiv] = block.children;
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
  moveInstrumentation(imageDiv, container);
  container.append(optimizedPic);

  block.replaceChildren(container);
}
