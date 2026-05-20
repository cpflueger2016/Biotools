"use strict";

const RCF_CONSTANT = 1.118e-5;
const DEFAULTS = {
  targetG: 850,
  centrifuges: {
    large: { name: "Larger centrifuge", fullRadius: 17.5, offset: 8 },
    small: { name: "Smaller centrifuge", fullRadius: 14.5, offset: 8 },
  },
};

const app = document.querySelector(".app");
const targetInput = document.querySelector("#targetG");
const targetSlider = document.querySelector("#targetSlider");
const toast = document.querySelector("#toast");
const quickButtons = [...document.querySelectorAll("[data-g]")];
const modeInputs = [...document.querySelectorAll('input[name="mode"]')];
const rotorInputs = [...document.querySelectorAll("[data-input]")];

let toastTimer = null;

function numberFromInput(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundTo(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function calculate(targetG, fullRadius, offset) {
  const effectiveRadius = fullRadius - offset;

  if (effectiveRadius <= 0 || targetG <= 0 || fullRadius <= 0) {
    return {
      effectiveRadius,
      rpm: Number.NaN,
      rcfSetting: Number.NaN,
    };
  }

  const rpm = Math.sqrt(targetG / (RCF_CONSTANT * effectiveRadius));
  const rcfSetting = targetG * (fullRadius / effectiveRadius);

  return { effectiveRadius, rpm, rcfSetting };
}

function formatInteger(value) {
  return Number.isFinite(value) ? `${Math.round(value)}` : "Check radius";
}

function formatRcf(value) {
  return Number.isFinite(value) ? `${Math.round(value)} x g` : "Check radius";
}

function formatCm(value) {
  return Number.isFinite(value) ? `${roundTo(value, 1)} cm` : "Check radius";
}

function readState() {
  return {
    targetG: numberFromInput(targetInput.value, DEFAULTS.targetG),
    centrifuges: {
      large: {
        fullRadius: numberFromInput(document.querySelector('[data-input="large-full"]').value, DEFAULTS.centrifuges.large.fullRadius),
        offset: numberFromInput(document.querySelector('[data-input="large-offset"]').value, DEFAULTS.centrifuges.large.offset),
      },
      small: {
        fullRadius: numberFromInput(document.querySelector('[data-input="small-full"]').value, DEFAULTS.centrifuges.small.fullRadius),
        offset: numberFromInput(document.querySelector('[data-input="small-offset"]').value, DEFAULTS.centrifuges.small.offset),
      },
    },
  };
}

function getStorage() {
  try {
    const testKey = "centrifugeCalculatorStorageTest";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return localStorage;
  } catch {
    return null;
  }
}

function saveState(state) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem("centrifugeCalculatorState", JSON.stringify(state));
}

function loadState() {
  const storage = getStorage();
  if (!storage) return;

  try {
    const saved = JSON.parse(storage.getItem("centrifugeCalculatorState"));
    if (!saved) return;

    setTarget(saved.targetG ?? DEFAULTS.targetG, false);
    for (const key of Object.keys(DEFAULTS.centrifuges)) {
      const savedConfig = saved.centrifuges?.[key];
      if (!savedConfig) continue;
      document.querySelector(`[data-input="${key}-full"]`).value = savedConfig.fullRadius ?? DEFAULTS.centrifuges[key].fullRadius;
      document.querySelector(`[data-input="${key}-offset"]`).value = savedConfig.offset ?? DEFAULTS.centrifuges[key].offset;
    }
  } catch {
    storage.removeItem("centrifugeCalculatorState");
  }
}

function setTarget(value, shouldUpdate = true) {
  const bounded = Math.min(2500, Math.max(50, Math.round(numberFromInput(value, DEFAULTS.targetG) / 10) * 10));
  targetInput.value = bounded;
  targetSlider.value = bounded;
  quickButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.g) === bounded);
  });
  if (shouldUpdate) update();
}

function updateCard(key, config, targetG) {
  const result = calculate(targetG, config.fullRadius, config.offset);
  const effectivePercent = Math.max(0, Math.min(100, (result.effectiveRadius / config.fullRadius) * 100));

  document.querySelector(`[data-out="${key}-rpm"]`).textContent = formatInteger(result.rpm);
  document.querySelector(`[data-out="${key}-rcf"]`).textContent = formatRcf(result.rcfSetting);
  document.querySelector(`[data-out="${key}-effective"]`).textContent = formatCm(result.effectiveRadius);
  document.querySelector(`[data-bar="${key}"]`).style.width = `${effectivePercent}%`;
}

function update() {
  const state = readState();
  updateCard("large", state.centrifuges.large, state.targetG);
  updateCard("small", state.centrifuges.small, state.targetG);
  saveState(state);
}

function copySettings(key) {
  const state = readState();
  const config = state.centrifuges[key];
  const result = calculate(state.targetG, config.fullRadius, config.offset);

  const text = [
    `${DEFAULTS.centrifuges[key].name}`,
    `Target at 1.5 ml tube end: ${Math.round(state.targetG)} x g`,
    `Effective radius: ${roundTo(result.effectiveRadius, 1)} cm`,
    `RPM setting: ${formatInteger(result.rpm)}`,
    `RCF setting: ${formatRcf(result.rcfSetting)}`,
  ].join("\n");

  if (!navigator.clipboard?.writeText) {
    showToast("Copy unavailable");
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => showToast("Settings copied"))
    .catch(() => showToast("Copy unavailable"));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 1800);
}

function handleTargetChange(event) {
  setTarget(event.target.value);
}

targetSlider.addEventListener("input", handleTargetChange);
targetSlider.addEventListener("change", handleTargetChange);
targetInput.addEventListener("input", handleTargetChange);
targetInput.addEventListener("change", handleTargetChange);

quickButtons.forEach((button) => {
  button.addEventListener("click", () => setTarget(button.dataset.g));
});

function updateMode() {
  app.dataset.mode = document.querySelector('input[name="mode"]:checked').value;
}

modeInputs.forEach((input) => {
  input.addEventListener("input", updateMode);
  input.addEventListener("change", updateMode);
});

rotorInputs.forEach((input) => {
  input.addEventListener("input", update);
  input.addEventListener("change", update);
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => copySettings(button.dataset.copy));
});

if ("serviceWorker" in navigator && ["https:", "http:"].includes(window.location.protocol)) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

loadState();
updateMode();
update();
