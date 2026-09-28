// Paste a Formspree (or similar) URL here to deliver join and question forms.
const FORM_ENDPOINT = "";

function setYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

function setupInterest() {
  const select = document.querySelector("[data-interest]");
  if (!select) return;
  const interest = new URLSearchParams(window.location.search).get("interest");
  if (!interest) return;
  const match = [...select.options].some((option) => option.value === interest);
  if (match) select.value = interest;
}

function clearErrors(form) {
  form.querySelectorAll("[aria-invalid]").forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
  form.querySelectorAll(".field-error").forEach((error) => error.remove());
}

function showError(field) {
  field.setAttribute("aria-invalid", "true");
  const message = document.createElement("p");
  message.className = "field-error";
  message.textContent = field.validationMessage;
  const slot = field.closest(".field");
  if (slot) {
    slot.append(message);
    return;
  }
  field.closest(".check")?.insertAdjacentElement("afterend", message);
}

function validate(form) {
  clearErrors(form);
  let valid = true;
  form.querySelectorAll("input, textarea, select").forEach((field) => {
    if (field.type === "hidden" || field.classList.contains("hp-input")) return;
    if (!field.checkValidity()) {
      valid = false;
      showError(field);
    }
  });
  if (!valid) form.querySelector("[aria-invalid='true']")?.focus();
  return valid;
}

function showSuccess(form) {
  const panel = document.querySelector("[data-success]");
  form.hidden = true;
  if (!panel) return;
  if (!FORM_ENDPOINT) {
    const pending = panel.querySelector("[data-pending]");
    if (pending) {
      pending.hidden = false;
      pending.textContent = "These answers are still only in this browser. They will be emailed once the form is connected to Danit’s inbox.";
    }
  }
  panel.hidden = false;
  panel.focus();
}

function setupForms() {
  const form = document.querySelector("[data-form]");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validate(form)) return;

    const honeypot = form.querySelector(".hp-input");
    if (honeypot && honeypot.value) return;

    const button = form.querySelector("[type='submit']");
    if (button) button.disabled = true;

    try {
      if (FORM_ENDPOINT) {
        const payload = Object.fromEntries(new FormData(form).entries());
        const interests = form.querySelectorAll("input[name='interests']:checked");
        if (interests.length) {
          payload.interests = [...interests].map((item) => item.value).join(", ");
        }
        const response = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Request failed");
      }
      showSuccess(form);
    } catch {
      if (button) button.disabled = false;
      const message = document.createElement("p");
      message.className = "field-error";
      message.textContent = "Something went wrong sending this. Please try again.";
      form.append(message);
    }
  });
}

setYear();
setupNav();
setupInterest();
setupForms();
