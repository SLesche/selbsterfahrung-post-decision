"use strict";
function summary() {
  const scores = Design.score(state.before, state.after, state.chosen, state.rejected);
  const unrelated = PRODUCTS.map(p => p.id).filter(id => id !== state.chosen && id !== state.rejected);
  return {
    ...scores, gift_change: state.condition === "gift" ? scores.chosen_change : null,
    chosen_change: state.condition === "gift" ? null : scores.chosen_change,
    unrelated_mean_change: unrelated.reduce((sum, id) => sum + state.after[id] - state.before[id], 0) / unrelated.length,
    completed: true, completed_at: new Date().toISOString()
  };
}
timeline.push(screen(() => {
  const s = summary();
  const fmt = n => n === null ? "—" : n.toFixed(2);
  const result = CONFIG.showIndividualResults ? `<h2>Deine Bewertungen</h2><table><thead><tr><th>Produkt</th><th>Vorher</th><th>Nachher</th><th>Änderung</th></tr></thead><tbody>${PRODUCTS.map(p => `<tr><td>${p.name}${p.id === state.chosen ? (state.condition === "gift" ? " (zugeteilt)" : " (gewählt)") : p.id === state.rejected ? " (nicht gewählt)" : ""}</td><td>${fmt(state.before[p.id])}</td><td>${fmt(state.after[p.id])}</td><td>${fmt(state.after[p.id] - state.before[p.id])}</td></tr>`).join("")}</tbody></table><p>Spreading of alternatives: <strong>${fmt(s.spreading)}</strong> Skalenpunkte. Bei Zuteilung wird dieser Wert nicht berechnet.</p>` : "";
  return `<h1>Was untersucht diese Übung?</h1><p>Nach Brehm (1956) können gewählte Alternativen nach einer Entscheidung attraktiver und abgelehnte Alternativen weniger attraktiv erscheinen. Das passt zur Idee, dass Menschen Dissonanz nach einer Entscheidung reduzieren.</p><p>Die angebotenen Paare wurden anhand deiner ersten Bewertungen zusammengestellt, um ähnlich oder unterschiedlich attraktive Alternativen anzubieten. Andere Personen erhielten eine virtuelle Zuteilung ohne Wahl. Je nach Bedingung betrafen die vier Berichte die Entscheidungsalternativen oder andere Produkte.</p>${result}<p>Die Kennzahl ist (Nachher − Vorher) für das gewählte Produkt minus (Nachher − Vorher) für das nicht gewählte Produkt. Positive Werte beschreiben eine stärkere Trennung der Bewertungen.</p><p><strong>Das ist kein individueller Nachweis von Dissonanz.</strong> Messfehler in Erstbewertungen und die zusätzliche Information durch die Wahl können bereits scheinbare Veränderungen erzeugen. Auch neue Produktinformationen, Erinnerung und Erwartungen an die Übung können Bewertungen verändern. Ein Nulleffekt oder umgekehrter Effekt ist ebenso möglich. Für kausale Aussagen wären zusätzliche Kontrollen nötig, etwa eine Rate–Rate–Choose-Bedingung.</p><p>Da alle Entscheidungen virtuell waren, kann die persönliche Bedeutung geringer sein als bei einer echten Produktwahl. Diskutiert im Seminar, wie sich dies auf die Ergebnisse auswirken könnte.</p><p class="muted">Brehm, J. W. (1956). Postdecision changes in the desirability of alternatives. Journal of Abnormal and Social Psychology, 52, 384–389.</p><p>Mit „Weiter“ wird der lokale CSV-Download angefordert.</p>`;
}, "debriefing", data => Object.assign(data, summary())));
function finishTask() {
  const container = jsPsych.getDisplayElement();
  container.innerHTML = '<h1>Vielen Dank!</h1><p>Die Übung ist abgeschlossen. Prüfe, ob die CSV-Datei im Downloadordner angekommen ist, und sichere sie nach den Vorgaben der Seminarleitung.</p><p id="download-status"></p><button class="primary-button" id="download">CSV erneut herunterladen</button>';
  const save = () => {
    try {
      jsPsych.data.get().localSave("csv", StudySession.filename());
      document.getElementById("download-status").textContent = "Download angefordert. Der Browser bestätigt hier nicht, ob die Datei gespeichert wurde.";
    } catch {
      document.getElementById("download-status").textContent = "Download konnte nicht gestartet werden. Bitte erneut versuchen.";
    }
  };
  document.getElementById("download").addEventListener("click", save);
  save();
}
jsPsych.run(timeline);
