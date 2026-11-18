(() => {
  const carousel = document.getElementById("testimonial-carousel");
  const controls = document.querySelector(".testimonial-controls");
  if (!carousel || !controls) return;

  const cards = [...carousel.querySelectorAll(".testimonial-card")];
  const previous = controls.querySelector('[data-testimonial-direction="-1"]');
  const next = controls.querySelector('[data-testimonial-direction="1"]');
  const count = controls.querySelector(".testimonial-count");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const positions = () => cards.map((card) => card.offsetLeft - cards[0].offsetLeft);
  const currentIndex = () => {
    const offsets = positions();
    const end = carousel.scrollWidth - carousel.clientWidth;
    if (end > 2 && carousel.scrollLeft >= end - 2) return cards.length - 1;
    return offsets.reduce((closest, offset, index) =>
      Math.abs(offset - carousel.scrollLeft) < Math.abs(offsets[closest] - carousel.scrollLeft)
        ? index : closest, 0);
  };
  const update = () => {
    previous.disabled = carousel.scrollLeft <= 2;
    next.disabled = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 2;
    count.textContent = `${currentIndex() + 1} of ${cards.length}`;
  };
  const moveTo = (left) => {
    carousel.scrollTo({
      left,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  };
  const moveBy = (direction) => {
    const end = Math.max(0, carousel.scrollWidth - carousel.clientWidth);
    const targets = [...new Set(positions().map((offset) => Math.min(offset, end)))];
    const target = direction > 0
      ? targets.find((offset) => offset > carousel.scrollLeft + 2) ?? end
      : targets.reverse().find((offset) => offset < carousel.scrollLeft - 2) ?? 0;
    moveTo(target);
  };

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-testimonial-direction]");
    if (button) moveBy(Number(button.dataset.testimonialDirection));
  });
  carousel.addEventListener("keydown", (event) => {
    if (event.target !== carousel) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") moveTo(0);
    else if (event.key === "End") moveTo(carousel.scrollWidth - carousel.clientWidth);
    else moveBy(event.key === "ArrowRight" ? 1 : -1);
  });
  carousel.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  controls.hidden = false;
  update();
})();
