import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-content';
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  const classes = ['logo', 'about', 'nav-1', 'nav-2', 'social', 'copyright'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(`footer-${c}`);
  });

  // social icons are served from DAM rather than the code bundle
  footer.querySelectorAll('.footer-social .icon img[data-icon-name]').forEach((img) => {
    img.src = `/content/dam/robinsonssupermarket/icons/coloured/${img.dataset.iconName}.svg`;
  });

  block.append(footer);
}
