import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import getSocialIconUrl from '../../scripts/social-icons.js';

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

  // social icons are served from DAM rather than the code bundle (see scripts/social-icons.js
  // for why this needs an absolute dynamic-media URL rather than a plain DAM path)
  footer.querySelectorAll('.footer-social .icon img[data-icon-name]').forEach((img) => {
    const url = getSocialIconUrl(img.dataset.iconName);
    if (url) img.src = url;
  });

  block.append(footer);
}
