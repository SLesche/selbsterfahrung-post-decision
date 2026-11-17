"use strict";
// Instructor settings. No URL condition overrides: students should not select their condition.
const CONFIG = Object.freeze({
  condition: "random", // random | high_info | high_noinfo | low_info | low_noinfo | gift
  highGap: [0.5, 1.5],
  lowGap: [2, 3.5], // combines the original medium/low conditions
  anchorRange: [5, 7],
  ratingStep: 0.1,
  showIndividualResults: true
});
const CONDITIONS = ["high_info", "high_noinfo", "low_info", "low_noinfo", "gift"];
if (CONFIG.condition !== "random" && !CONDITIONS.includes(CONFIG.condition)) throw Error("Unbekannte Bedingung.");
for (const key of ["highGap", "lowGap", "anchorRange"]) {
  const [a, b] = CONFIG[key];
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || a > b || b > 8) throw Error(`Ungültig: ${key}`);
}
if (!Number.isFinite(CONFIG.ratingStep) || CONFIG.ratingStep <= 0 || CONFIG.ratingStep > 1) throw Error("Ungültige Schrittweite.");
