(() => {
  const carousel = document.getElementById("testimonial-carousel");
  if (!carousel) return;

  const cards = [...carousel.querySelectorAll(".testimonial-card")];
  if (cards.length < 2) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let userPaused = reducedMotion.matches;
  let hovered = false;
  let focused = false;
  let touching = false;
  let autoplayTimer;
  let settleTimer;

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
  const readingTime = () => {
    const words = slides[currentIndex()].textContent.trim().split(/\s+/).length;
    return Math.max(8000, Math.min(35000, words / 250 * 60000));
  };
  const schedule = () => {
    window.clearTimeout(autoplayTimer);
    if (userPaused || hovered || focused || touching || document.hidden) return;
    autoplayTimer = window.setTimeout(() => moveBy(1), readingTime());
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

  carousel.addEventListener("keydown", (event) => {
    if (event.target !== carousel) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") moveTo(1);
    else if (event.key === "End") moveTo(cards.length);
    else moveBy(event.key === "ArrowRight" ? 1 : -1);
  });
  carousel.addEventListener("scroll", () => {
    window.clearTimeout(autoplayTimer);
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 180);
  }, { passive: true });
  carousel.addEventListener("scrollend", settle);
  carousel.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") { hovered = true; schedule(); }
  });
  carousel.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") { hovered = false; schedule(); }
  });
  carousel.addEventListener("pointerdown", () => { touching = true; schedule(); });
  window.addEventListener("pointerup", () => {
    if (touching) { touching = false; schedule(); }
  });
  window.addEventListener("pointercancel", () => {
    if (touching) { touching = false; schedule(); }
  });
  carousel.addEventListener("focusin", () => { focused = true; schedule(); });
  carousel.addEventListener("focusout", () => {
    focused = carousel.contains(document.activeElement);
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) userPaused = true;
    schedule();
  });
  let activeIndex = 1;
  carousel.addEventListener("scroll", () => { activeIndex = currentIndex(); }, { passive: true });
  window.addEventListener("resize", () => {
    moveTo(activeIndex, true);
    schedule();
  });
  moveTo(1, true);
  schedule();
})();
