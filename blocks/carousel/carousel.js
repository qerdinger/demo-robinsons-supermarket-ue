import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * loads and decorates the carousel
 * @param {Element} block The carousel block element
 */
export default function decorate(block) {
  const slides = [...block.children];

  const track = document.createElement('div');
  track.className = 'carousel-track';

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
    moveInstrumentation(row, slide);

    if (picture) {
      const img = picture.querySelector('img');
      const optimizedPic = createOptimizedPicture(img.src, altText || img.alt, i === 0, [{ width: '1600' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      const wrapper = href ? document.createElement('a') : slide;
      if (href) {
        wrapper.href = href;
        slide.append(wrapper);
      }
      wrapper.append(optimizedPic);
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
  if (slides.length > 1) {
    block.append(prevButton, nextButton);
    block.addEventListener('mouseenter', stopAutoplay);
    block.addEventListener('mouseleave', startAutoplay);
    startAutoplay();
  }
}
