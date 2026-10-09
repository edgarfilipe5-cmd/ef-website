/* EF / Candidatura QA. IMPORTANT: preview mode is hard-locked. No network requests. */
(() => {
  "use strict";
  const form = document.getElementById("efApplication");
  if (!form) return;
  const stage1 = form.querySelector('[data-step="1"]');
  const stage2 = form.querySelector('[data-step="2"]');
  const next = document.getElementById("nextButton");
  const back = document.getElementById("backButton");
  const restart = document.getElementById("restartButton");
  const feedback = document.getElementById("feedback");
  const success = document.getElementById("successState");
  const indicator = document.getElementById("stepIndicator");
  const percent = document.getElementById("progressPercent");
  const progress = document.getElementById("progressFill");
  const startedAt = Date.now();

  function setStep(step) {
    stage1.hidden = step !== 1;
    stage2.hidden = step !== 2;
    indicator.textContent = "ETAPA 0" + step + " / 02";
    percent.textContent = (step === 1 ? 50 : 100) + "%";
    progress.style.width = (step === 1 ? 50 : 100) + "%";
    feedback.hidden = true;
    const heading = (step === 1 ? stage1 : stage2).querySelector("h3");
    if (heading) heading.setAttribute("tabindex", "-1");
    if (heading) heading.focus({ preventScroll: true });
    form.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }
  function validateStep(element) {
    const required = Array.from(element.querySelectorAll("[required]"));
    for (const field of required) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }
  function showError(message) {
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.scrollIntoView({ block: "nearest" });
  }
  next.addEventListener("click", () => {
    if (!validateStep(stage1)) return;
    const description = document.getElementById("situation").value.trim();
    if (description.length < 12) {
      showError("Explica um pouco melhor a dificuldade atual (mínimo de 12 caracteres).");
      return;
    }
    setStep(2);
  });
  back.addEventListener("click", () => setStep(1));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateStep(stage2)) return;
    if (form.companyWebsite.value.trim()) {
      showError("Não foi possível concluir a simulação.");
      return;
    }
    if (Date.now() - startedAt < 1500) {
      showError("Revê os dados preenchidos antes de continuar.");
      return;
    }
    // This isolated branch is visual QA only. No fetch(), no cookies, no persistence.
    form.hidden = true;
    success.hidden = false;
    indicator.textContent = "SIMULAÇÃO";
    percent.textContent = "100%";
    progress.style.width = "100%";
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  restart.addEventListener("click", () => {
    form.reset();
    success.hidden = true;
    form.hidden = false;
    setStep(1);
  });
})();
