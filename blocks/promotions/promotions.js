import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the promotions block
 * @param {Element} block The promotions block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const [imageDiv, altDiv, titleDiv, descriptionDiv, linkDiv] = row.children;
    const picture = imageDiv?.querySelector('picture');
    const altText = altDiv?.textContent.trim();
    const title = titleDiv?.textContent.trim();
    const description = descriptionDiv?.textContent.trim();
    const href = linkDiv?.textContent.trim();

    const li = document.createElement('li');
    li.className = 'promotions-card';
    moveInstrumentation(row, li);

    const container = href ? document.createElement('a') : document.createElement('div');
    if (href) container.href = href;
    container.className = 'promotions-card-link';

    if (picture) {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'promotions-card-image';
      const img = picture.querySelector('img');
      const optimizedPic = createOptimizedPicture(img.src, altText || img.alt, false, [{ width: '750' }]);
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
