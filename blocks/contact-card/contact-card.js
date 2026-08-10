import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the contact card
 * @param {Element} block The contact card block element
 */
export default function decorate(block) {
  const [headingDiv, descriptionDiv, linkTextDiv, linkDiv] = block.children;
  const heading = headingDiv?.textContent.trim();
  const description = descriptionDiv?.textContent.trim();
  const linkText = linkTextDiv?.textContent.trim();
  const link = linkDiv?.querySelector('a');
  const href = link ? link.href : linkDiv?.textContent.trim();

  const card = document.createElement('div');
  card.className = 'contact-card-inner';
  moveInstrumentation(block, card);

  const icon = document.createElement('div');
  icon.className = 'contact-card-icon';
  card.append(icon);

  if (heading) {
    const headingEl = document.createElement('p');
    headingEl.className = 'contact-card-heading';
    headingEl.textContent = heading;
    card.append(headingEl);
  }

  if (description) {
    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'contact-card-description';
    descriptionEl.textContent = description;
    card.append(descriptionEl);
  }

  if (href && linkText) {
    const cta = document.createElement('a');
    cta.className = 'contact-card-cta';
    cta.href = href;
    cta.textContent = linkText;
    card.append(cta);
  }

  block.replaceChildren(card);
}
