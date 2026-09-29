// Contact form: inline validation with specific, human error messages,
// a simulated ~900 ms send, and a designed success state.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function checkName(value) {
  const v = value.trim();
  if (!v) return "Tell us your name so we know who we're talking to.";
  if (v.length < 2) return "That's a little short. Your first name is fine.";
  return "";
}

function checkEmail(value) {
  const v = value.trim();
  if (!v) return "";
  if (!v.includes("@")) return "This needs an @, for example name@company.lk.";
  if (/\s/.test(v)) return "Email addresses can't contain spaces.";
  if (!EMAIL.test(v)) return "Add the domain ending, like .com or .lk, after the @.";
  return "";
}

function checkPhone(value) {
  const v = value.trim();
  if (!v) return "";
  const digits = v.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return "Use digits only, with an optional + for the country code.";
  const count = digits.replace("+", "").length;
  if (count < 9 || count > 15) return "That number looks too short or long. Try the format +94 76 088 7702.";
  return "";
}

function checkMessage(value) {
  const v = value.trim();
  if (!v) return "A line or two about the project is enough to get started.";
  if (v.length < 10) return "Could you add a little more? One sentence helps us prepare.";
  return "";
}

export function initContact() {
  const panel = document.querySelector("[data-contact]");
  if (!panel) return;
  const form = panel.querySelector("[data-contact-form]");
  const success = panel.querySelector("[data-contact-success]");
  const successText = panel.querySelector("[data-success-text]");
  const submit = form.querySelector("[data-submit]");
  const submitText = form.querySelector("[data-submit-text]");
  const status = form.querySelector("[data-form-status]");
  const hint = form.querySelector("[data-reach-hint]");
  const reset = panel.querySelector("[data-contact-reset]");
  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    phone: form.elements.phone,
    message: form.elements.message,
  };
  const touched = new Set();
  let submitted = false;
  let sending = false;

  function show(input, message) {
    const wrap = input.closest("[data-field]");
    const out = wrap.querySelector("[data-error]");
    out.textContent = message;
    wrap.classList.toggle("is-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate(which) {
    const errors = {};
    const reachMissing = !fields.email.value.trim() && !fields.phone.value.trim();
    errors.name = checkName(fields.name.value);
    errors.email = checkEmail(fields.email.value);
    errors.phone = checkPhone(fields.phone.value);
    errors.message = checkMessage(fields.message.value);

    for (const key of Object.keys(fields)) {
      if (which === "all" || touched.has(key)) show(fields[key], errors[key]);
    }

    const showReach = reachMissing && (submitted || (touched.has("email") && touched.has("phone")));
    hint.classList.toggle("is-error", showReach);
    hint.textContent = showReach
      ? "Add an email or a phone number so we can reply. One is enough."
      : "Email or phone: at least one, so we can reply.";
    if (showReach) {
      fields.email.setAttribute("aria-invalid", "true");
      fields.phone.setAttribute("aria-invalid", "true");
    }

    return { errors, reachMissing };
  }

  for (const [key, input] of Object.entries(fields)) {
    input.addEventListener("blur", () => {
      if (!input.value.trim() && !submitted) return;
      touched.add(key);
      validate(key);
    });
    input.addEventListener("input", () => {
      if (touched.has(key) || submitted) validate(key);
      if ((key === "email" || key === "phone") && hint.classList.contains("is-error")) validate(key);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (sending) return;
    submitted = true;
    Object.keys(fields).forEach((k) => touched.add(k));
    const { errors, reachMissing } = validate("all");
    const bad = Object.keys(fields).filter((k) => errors[k]);
    if (reachMissing && !bad.includes("email")) bad.push("email");

    if (bad.length) {
      const order = ["name", "email", "phone", "message"];
      const first = order.find((k) => bad.includes(k));
      const count = new Set(bad.map((k) => (k === "phone" && reachMissing ? "email" : k))).size;
      status.textContent = count === 1 ? "One thing to fix before we can send this." : `${count} things to fix before we can send this.`;
      status.classList.add("is-error");
      fields[first].focus();
      return;
    }

    sending = true;
    status.textContent = "Sending your message…";
    status.classList.remove("is-error");
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    form.classList.add("is-sending");
    submitText.textContent = "Sending";

    window.setTimeout(() => {
      const first = fields.name.value.trim().split(/\s+/)[0];
      const reach = fields.email.value.trim() || fields.phone.value.trim();
      successText.textContent = `Thanks, ${first}. We'll get back to you at ${reach} soon. Can't wait? Call the studio on +94 76 088 7702.`;
      form.hidden = true;
      success.hidden = false;
      panel.classList.add("is-sent");
      success.focus();
      status.textContent = "";
      sending = false;
    }, 900);
  });

  reset.addEventListener("click", () => {
    form.reset();
    touched.clear();
    submitted = false;
    Object.values(fields).forEach((input) => show(input, ""));
    validate("none");
    submit.disabled = false;
    submit.removeAttribute("aria-busy");
    form.classList.remove("is-sending");
    submitText.textContent = "Send message";
    status.classList.remove("is-error");
    success.hidden = true;
    form.hidden = false;
    panel.classList.remove("is-sent");
    fields.name.focus();
  });
}
