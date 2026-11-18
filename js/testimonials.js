(() => {
  const carousel = document.getElementById("testimonial-carousel");
  const slider = document.querySelector(".testimonial-slider");
  if (!carousel || !slider) return;

  const cards = [...carousel.querySelectorAll(".testimonial-card")];
  if (cards.length < 2) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let userPaused = reducedMotion.matches;
  let hovered = false;
  let focused = false;
  let touching = false;
  let autoplayTimer;
  let settleTimer;
  const supportsScrollEnd = "onscrollend" in carousel;

  // Duplicate only the edge cards so a swipe can continue in either direction.
  const edgeCopy = (card) => {
    const copy = card.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    copy.setAttribute("inert", "");
    return copy;
  };
  carousel.prepend(edgeCopy(cards[cards.length - 1]));
  carousel.append(edgeCopy(cards[0]));
  const slides = [...carousel.querySelectorAll(".testimonial-card")];
  const positions = () => slides.map((slide) => slide.offsetLeft - slides[0].offsetLeft);
  const currentIndex = () => {
    const offsets = positions();
    return offsets.reduce((closest, offset, index) =>
      Math.abs(offset - carousel.scrollLeft) < Math.abs(offsets[closest] - carousel.scrollLeft)
        ? index : closest, 0);
  };
  const AUTOPLAY_DELAY = 10000; // advance to the next testimonial every 10 seconds
  const schedule = () => {
    window.clearTimeout(autoplayTimer);
    if (userPaused || hovered || focused || touching || document.hidden) return;
    autoplayTimer = window.setTimeout(() => moveBy(1), AUTOPLAY_DELAY);
  };
  const moveTo = (index, instant = false) => {
    window.clearTimeout(autoplayTimer);
    const target = Math.max(0, Math.min(slides.length - 1, index));
    carousel.scrollTo({
      left: positions()[target],
      behavior: instant || reducedMotion.matches ? "instant" : "smooth",
    });
  };
  const settle = () => {
    window.clearTimeout(settleTimer);
    const index = currentIndex();
    if (index === 0) moveTo(cards.length, true);
    else if (index === slides.length - 1) moveTo(1, true);
    schedule();
  };
  const moveBy = (direction) => {
    settle();
    moveTo(currentIndex() + direction);
  };

  slider.querySelectorAll("[data-testimonial-direction]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () => moveBy(Number(button.dataset.testimonialDirection)));
  });
  slider.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") moveTo(1);
    else if (event.key === "End") moveTo(cards.length);
    else moveBy(event.key === "ArrowRight" ? 1 : -1);
  });
  carousel.addEventListener("scroll", () => {
    window.clearTimeout(autoplayTimer);
    if (!supportsScrollEnd) {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 250);
    }
  }, { passive: true });
  if (supportsScrollEnd) carousel.addEventListener("scrollend", settle);
  slider.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") { hovered = true; schedule(); }
  });
  slider.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") { hovered = false; schedule(); }
  });
  slider.addEventListener("pointerdown", () => { touching = true; schedule(); });
  window.addEventListener("pointerup", () => {
    if (touching) { touching = false; schedule(); }
  });
  window.addEventListener("pointercancel", () => {
    if (touching) { touching = false; schedule(); }
  });
  slider.addEventListener("focusin", () => { focused = true; schedule(); });
  slider.addEventListener("focusout", (event) => {
    focused = slider.contains(event.relatedTarget);
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) userPaused = true;
    schedule();
  });
  let activeIndex = 1;
  carousel.addEventListener("scroll", () => { activeIndex = currentIndex(); }, { passive: true });
  // An instant jump still fires a scroll event, which clears the timer;
  // wait two frames so that event has passed before starting autoplay.
  const scheduleAfterJump = () => requestAnimationFrame(() => requestAnimationFrame(schedule));
  window.addEventListener("resize", () => {
    moveTo(activeIndex, true);
    scheduleAfterJump();
  });
  moveTo(1, true);
  scheduleAfterJump();
})();
