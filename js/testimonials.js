(() => {
  const carousel = document.getElementById("testimonial-carousel");
  const slider = document.querySelector(".testimonial-slider");
  if (!carousel || !slider) return;

  const cards = [...carousel.querySelectorAll(".testimonial-card")];
  if (cards.length < 2) return;
  const AUTOPLAY_DELAY = 10000; // advance to the next testimonial every 10 seconds
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let userPaused = reducedMotion.matches;
  let hovered = false;
  let focused = false;
  let touching = false;
  let settleTimer;
  const supportsScrollEnd = "onscrollend" in carousel;

  // Each card gets a progress bar along its top edge; when it fills, the carousel advances.
  cards.forEach((card) => {
    const bar = document.createElement("span");
    bar.className = "testimonial-progress";
    bar.setAttribute("aria-hidden", "true");
    card.prepend(bar);
  });

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

  // The progress animation is the timer: pausing it pauses the countdown,
  // and the carousel moves on when it finishes.
  let progress = null;
  let progressIndex = -1;
  const canPlay = () => !(userPaused || hovered || focused || touching || document.hidden);
  const stopProgress = () => {
    if (!progress) return;
    progress.onfinish = null;
    progress.cancel();
    progress = null;
    progressIndex = -1;
  };
  const startProgress = () => {
    stopProgress();
    if (userPaused) return;
    progressIndex = currentIndex();
    const bar = slides[progressIndex].querySelector(".testimonial-progress");
    progress = bar.animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: AUTOPLAY_DELAY, easing: "linear", fill: "forwards" },
    );
    progress.onfinish = () => moveBy(1);
    if (!canPlay()) progress.pause();
  };
  const updatePlayState = () => {
    if (!progress) return;
    if (canPlay()) progress.play();
    else progress.pause();
  };

  const moveTo = (index, instant = false) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    carousel.scrollTo({
      left: positions()[target],
      behavior: instant || reducedMotion.matches ? "instant" : "smooth",
    });
  };
  const goTo = (index) => {
    stopProgress();
    moveTo(index);
  };
  const settle = () => {
    window.clearTimeout(settleTimer);
    const index = currentIndex();
    if (index === 0) moveTo(cards.length, true);
    else if (index === slides.length - 1) moveTo(1, true);
    // Keep a running countdown if we're still on the same card; otherwise start fresh.
    if (!progress || progressIndex !== currentIndex()) startProgress();
  };
  const moveBy = (direction) => {
    settle();
    goTo(currentIndex() + direction);
  };

  slider.querySelectorAll("[data-testimonial-direction]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () => moveBy(Number(button.dataset.testimonialDirection)));
  });
  slider.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") goTo(1);
    else if (event.key === "End") goTo(cards.length);
    else moveBy(event.key === "ArrowRight" ? 1 : -1);
  });
  let activeIndex = 1;
  carousel.addEventListener("scroll", () => {
    activeIndex = currentIndex();
    // A swipe onto another card cancels its countdown; settle starts a new one.
    if (progress && activeIndex !== progressIndex) stopProgress();
    if (!supportsScrollEnd) {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 250);
    }
  }, { passive: true });
  if (supportsScrollEnd) carousel.addEventListener("scrollend", settle);

  // Pause while a mouse is over the box, during a touch, or while it has keyboard focus.
  slider.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") { hovered = true; updatePlayState(); }
  });
  slider.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") { hovered = false; updatePlayState(); }
  });
  slider.addEventListener("pointerdown", () => { touching = true; updatePlayState(); });
  window.addEventListener("pointerup", () => {
    if (touching) { touching = false; updatePlayState(); }
  });
  window.addEventListener("pointercancel", () => {
    if (touching) { touching = false; updatePlayState(); }
  });
  slider.addEventListener("focusin", (event) => {
    focused = event.target.matches(":focus-visible");
    updatePlayState();
  });
  slider.addEventListener("focusout", (event) => {
    focused = Boolean(event.relatedTarget && slider.contains(event.relatedTarget)
      && event.relatedTarget.matches(":focus-visible"));
    updatePlayState();
  });
  document.addEventListener("visibilitychange", updatePlayState);
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) { userPaused = true; stopProgress(); }
  });
  window.addEventListener("resize", () => {
    moveTo(activeIndex, true);
    if (!progress || progressIndex !== currentIndex()) startProgress();
  });

  moveTo(1, true);
  startProgress();
})();
