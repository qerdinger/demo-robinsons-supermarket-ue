import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the carousel
 * @param {Element} block The carousel block element
 */
export default function decorate(block) {
  const slides = [...block.children];

  const track = document.createElement('div');
  track.className = 'carousel-track';

  // size the track to the active slide's natural image proportions, so a taller
  // image is shown in full rather than being cropped to a fixed aspect ratio
  function syncHeight() {
    const img = track.querySelector('.carousel-slide.active img');
    if (img && img.naturalWidth) {
      track.style.height = `${(track.offsetWidth * img.naturalHeight) / img.naturalWidth}px`;
    }
  }
  window.addEventListener('resize', syncHeight);

  const indicators = document.createElement('div');
  indicators.className = 'carousel-indicators';

  slides.forEach((row, i) => {
    const [imageDiv, altDiv, linkDiv] = row.children;
    const picture = imageDiv?.querySelector('picture');
    const altText = altDiv?.textContent.trim();
    const href = linkDiv?.textContent.trim();

    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    if (i === 0) slide.classList.add('active');

    if (picture) {
      const img = picture.querySelector('img');
      const optimizedPic = createOptimizedPicture(img.src, altText || img.alt, i === 0, [{ width: '1600' }]);
      const wrapper = href ? document.createElement('a') : slide;
      if (href) {
        wrapper.href = href;
        slide.append(wrapper);
      }
      wrapper.append(optimizedPic);
      const newImg = optimizedPic.querySelector('img');
      if (newImg.complete) syncHeight();
      else newImg.addEventListener('load', () => { if (slide.classList.contains('active')) syncHeight(); });
    }

    track.append(slide);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show slide ${i + 1} of ${slides.length}`);
    if (i === 0) dot.classList.add('active');
    indicators.append(dot);
  });

  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.className = 'carousel-control carousel-control-prev';
  prevButton.setAttribute('aria-label', 'Previous slide');
  prevButton.innerHTML = '<span class="carousel-arrow-icon"></span>';

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'carousel-control carousel-control-next';
  nextButton.setAttribute('aria-label', 'Next slide');
  nextButton.innerHTML = '<span class="carousel-arrow-icon"></span>';

  let current = 0;
  let timer;

  function goToSlide(index) {
    const total = slides.length;
    current = ((index % total) + total) % total;
    [...track.children].forEach((slide, i) => slide.classList.toggle('active', i === current));
    [...indicators.children].forEach((dot, i) => dot.classList.toggle('active', i === current));
    syncHeight();
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
  }

  function startAutoplay() {
    stopAutoplay();
    if (slides.length > 1) timer = setInterval(() => goToSlide(current + 1), 2500);
  }

  prevButton.addEventListener('click', () => { goToSlide(current - 1); startAutoplay(); });
  nextButton.addEventListener('click', () => { goToSlide(current + 1); startAutoplay(); });
  [...indicators.children].forEach((dot, i) => {
    dot.addEventListener('click', () => { goToSlide(i); startAutoplay(); });
  });

  block.textContent = '';
  block.append(track, indicators);
  syncHeight();
  if (slides.length > 1) {
    block.append(prevButton, nextButton);
    block.addEventListener('mouseenter', stopAutoplay);
    block.addEventListener('mouseleave', startAutoplay);
    startAutoplay();
  }
}
