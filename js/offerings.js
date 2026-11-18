const offeringsLayout = document.getElementById("offerings-layout");
const offeringsView = document.querySelector(".offerings-view");

const compareOfferings = new URLSearchParams(window.location.search).get("compare") === "1";

if (compareOfferings && offeringsLayout && offeringsView) {
  const buttons = [...offeringsView.querySelectorAll("[data-offerings-view]")];
  offeringsView.hidden = false;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      offeringsLayout.dataset.view = button.dataset.offeringsView;
      buttons.forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
    });
  });
}
