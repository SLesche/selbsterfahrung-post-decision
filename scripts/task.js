"use strict";
const state = {
  condition: CONFIG.condition === "random" ? CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)] : CONFIG.condition,
  before: {}, after: {}, pair: null, chosen: null, rejected: null, reports: []
};
const jsPsych = initJsPsych({ on_finish: () => finishTask() });
const shuffle = values => jsPsych.randomization.shuffle([...values]);
const firstOrder = shuffle(PRODUCTS.map(p => p.id));
const secondOrder = shuffle(PRODUCTS.map(p => p.id));
jsPsych.data.addProperties({
  ...StudySession.metadata(), task: "postdecision", task_version: "1.2.0",
  task_run_id: jsPsych.randomization.randomID(12), started_at: new Date().toISOString(),
  assigned_condition: state.condition, virtual_only: true, instruction_version: "brehm-close-2",
  config: JSON.stringify(CONFIG), initial_order: firstOrder.join("|"), repeat_order: secondOrder.join("|")
});
function screen(html, event, onFinish) {
  return { type: jsPsychHtmlButtonResponse, stimulus: html, choices: ["Weiter"], data: { event }, on_finish: onFinish };
}
function rating(id) {
  return `<fieldset class="rating-box"><legend>${product(id).name}</legend>
    <label for="rating-${id}">Wie wünschenswert ist dieses Produkt für dich?</label>
    <output class="rating-value" id="value-${id}">Bitte eine Bewertung abgeben</output>
    <input type="range" id="rating-${id}" name="${id}" min="1" max="8" step="${CONFIG.ratingStep}" value="4.5" aria-describedby="ends-${id}">
    <div class="ticks" aria-hidden="true">${[1,2,3,4,5,6,7,8].map(n => `<span>${n}</span>`).join("")}</div>
    <div class="endpoints" id="ends-${id}"><span>1 · eindeutig überhaupt nicht wünschenswert</span><span>8 · äußerst wünschenswert</span></div></fieldset>`;
}
// Sliders require an explicit interaction; a click at the midpoint is accepted too.
function activateRatings(ids) {
  const touched = new Set();
  const next = document.querySelector("#jspsych-survey-html-form-next");
  next.disabled = true;
  ids.forEach(id => {
    const input = document.getElementById(`rating-${id}`);
    const update = () => {
      touched.add(id);
      document.getElementById(`value-${id}`).textContent = Number(input.value).toFixed(1);
      next.disabled = touched.size !== ids.length;
    };
    input.addEventListener("input", update);
    input.addEventListener("pointerup", update);
    input.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); update(); } });
  });
}
const timeline = [
  screen(TEXT.welcome, "welcome"),
  ...firstOrder.map((id, index) => screen(`<h1>Artikel ${index + 1} von 8</h1>${card(product(id))}<p>Sieh dir den Artikel und seine Beschreibung sorgfältig an.</p>`, "product_introduction", data => { data.item_id = id; data.presentation_position = index + 1; })),
  screen(TEXT.ratings, "rating_instructions"),
  {
    type: jsPsychSurveyHtmlForm,
    preamble: "<h1>Beurteilung der acht Artikel</h1><p>Alle Artikel und Skalen stehen gemeinsam zur Verfügung. Sieh dir jeden Artikel sorgfältig an und nimm dir so viel Zeit, wie du möchtest.</p>",
    html: `<div class="grid">${firstOrder.map(id => `<div class="product-rating">${card(product(id))}${rating(id)}</div>`).join("")}</div>`,
    button_label: "Bewertungen abschließen", data: { event: "initial_ratings" },
    on_load: () => activateRatings(firstOrder),
    on_finish: data => {
      firstOrder.forEach(id => { state.before[id] = Number(data.response[id]); data[`pre_${id}`] = state.before[id]; });
      state.pair = Design.select(state.before, state.condition, CONFIG);
      state.reports = Design.reportIds(PRODUCTS.map(p => p.id), state.pair, state.condition, shuffle);
      Object.assign(data, { ...state.pair, report_ids: state.reports.join("|") });
      jsPsych.data.addProperties({
        anchor_id: state.pair.anchor, other_id: state.pair.other,
        actual_gap: state.pair.gap, manipulation_eligible: state.pair.eligible,
        selection_fallback: state.pair.fallback, report_ids: state.reports.join("|")
      });
    }
  },
  {
    timeline: [{
      type: jsPsychSurveyHtmlForm, button_label: "Virtuelle Auswahl verbindlich bestätigen",
      html: () => {
        state.choiceOrder = shuffle([state.pair.anchor, state.pair.other]);
        return `<h1>Auswahl deines Artikels</h1><p>Stell dir nun vor, du erhältst für deine Mitarbeit einen der acht Artikel, die du gerade beurteilt hast.</p><p>Da die attraktiveren Artikel besonders häufig gewählt würden und nicht von jedem Artikel genügend Exemplare vorhanden sind, ist die Auswahl begrenzt. Im vorgestellten Projekt wurde dafür eine Liste mit Artikelpaaren zusammengestellt; jede Person erhält ein als zufällig gezogen dargestelltes Paar zur Auswahl.</p><p>Für dich stehen die folgenden beiden Artikel zur Verfügung. Welchen möchtest du erhalten? Entscheide dich bitte für einen der beiden.</p><div class="grid">${state.choiceOrder.map(id => `<label class="choice-option">${card(product(id))}<input type="radio" required name="choice" value="${id}"> Diesen Artikel wählen</label>`).join("")}</div>`;
      },
      data: { event: "choice" }, on_finish: data => {
        state.chosen = data.response.choice;
        state.rejected = state.chosen === state.pair.anchor ? state.pair.other : state.pair.anchor;
        data.choice_order = state.choiceOrder.join("|");
        data.chose_initially_lower = state.before[state.chosen] < state.before[state.rejected];
        data.initially_tied = state.before[state.chosen] === state.before[state.rejected];
        jsPsych.data.addProperties({ chosen_id: state.chosen, rejected_id: state.rejected, chose_initially_lower: data.chose_initially_lower });
      }
    }], conditional_function: () => state.condition !== "gift"
  },
  {
    timeline: [screen(() => `<h1>Zuteilung deines Artikels</h1><p>Stell dir vor, du erhältst für deine Mitarbeit einen der Artikel. Damit die Vorräte einzelner Artikel nicht ausgehen, bekommst du im vorgestellten Projekt einen Artikel, dessen Zuteilung als vorher zufällig festgelegt dargestellt wird. Du musst dich also nicht zwischen zwei Artikeln entscheiden.</p><p>Dir wird folgender Artikel zugeteilt:</p>${card(product(state.pair.anchor))}`, "gift_assignment", () => {
      state.chosen = state.pair.anchor;
      jsPsych.data.addProperties({ chosen_id: state.chosen, rejected_id: null, chose_initially_lower: false });
    })], conditional_function: () => state.condition === "gift"
  },
  screen(() => `<h1>Dein Artikel ist für dich verpackt</h1><p><strong>${product(state.chosen).name}</strong></p><p>Stell dir vor, dieser Artikel wird jetzt in seine Schachtel zurückgelegt. Die Schachtel wird geschlossen, mit einer Schnur fest verschnürt und zu deinen persönlichen Sachen gestellt. Der Artikel gehört im vorgestellten Szenario nun dir.</p><p>Die Auswahl bzw. Zuteilung ist damit abgeschlossen.</p>`, "commitment"),
  screen(TEXT.reports, "report_instructions")
];
for (let i = 0; i < 4; i++) timeline.push(screen(() => {
  const p = product(state.reports[i]);
  return `<h1>Gutachten ${i + 1} von 4</h1><article class="report"><h2>${p.name}</h2><p>${p.report}</p></article><p>Lies das Gutachten sorgfältig. Die Fragen folgen, nachdem du alle vier Gutachten gelesen hast.</p>`;
}, "report_reading", data => { data.item_id = state.reports[i]; data.report_position = i + 1; }));
for (let i = 0; i < 4; i++) timeline.push({
  type: jsPsychSurveyHtmlForm, button_label: "Nächster Schritt",
  html: () => { const p = product(state.reports[i]); return `<h1>Fragen zu den Gutachten · ${i + 1} von 4</h1><h2>${p.name}</h2><details class="report-revisit"><summary>Gutachten zu diesem Artikel noch einmal anzeigen</summary><div class="report"><p>${p.report}</p></div></details><label>Was erscheint dir an diesem Artikel gut?<textarea name="positive" required maxlength="800"></textarea></label><label>Was erscheint dir an diesem Artikel schlecht?<textarea name="negative" required maxlength="800"></textarea></label><label>Welche Aussagen wären für die Werbung für diesen Artikel geeignet?<textarea name="advertising" required maxlength="800"></textarea></label>`; },
  data: { event: "product_report", report_position: i + 1 },
  on_finish: data => { data.item_id = state.reports[i]; data.is_choice_item = [state.chosen, state.rejected].includes(data.item_id); }
});
timeline.push(screen(TEXT.rerate, "repeat_instructions"));
secondOrder.forEach((id, index) => timeline.push({
  type: jsPsychSurveyHtmlForm, preamble: `<h1>Erneute Bewertung · ${index + 1} von 8</h1>`,
  html: rating(id), button_label: "Bewertung bestätigen", on_load: () => activateRatings([id]),
  data: { event: "repeat_rating", item_id: id, repeat_position: index + 1 },
  on_finish: data => {
    state.after[id] = Number(data.response[id]);
    Object.assign(data, { rating: state.after[id], initial_rating: state.before[id], rating_change: state.after[id] - state.before[id],
      item_role: id === state.chosen ? (state.condition === "gift" ? "gift" : "chosen") : id === state.rejected ? "rejected" : "unrelated",
      report_seen: state.reports.includes(id) });
  }
}));
