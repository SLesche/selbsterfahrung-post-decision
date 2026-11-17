"use strict";
// Fictional, unbranded materials. Reports are teaching scenarios, not real product claims.
const PRODUCTS = [
  { id: "speaker", name: "Kompakter Bluetooth-Lautsprecher", icon: "speaker", description: "Tragbarer Lautsprecher für Musik zu Hause und unterwegs; ungefähr 30 €.", report: "Der Klang ist bei mittlerer Lautstärke ausgewogen. Das Gehäuse ist spritzwassergeschützt. Bei hoher Lautstärke werden Bässe schwächer. Ein Netzteil liegt nicht bei." },
  { id: "bottle", name: "Isolierte Trinkflasche", icon: "bottle", description: "Wiederverwendbare Edelstahlflasche, 600 ml, für warme und kalte Getränke; ungefähr 25 €.", report: "Getränke bleiben mehrere Stunden temperiert. Der Verschluss hält beim Transport dicht. Die Flasche ist relativ schwer. Der Deckel muss von Hand gereinigt werden." },
  { id: "powerbank", name: "Kompakte Powerbank", icon: "powerbank", description: "Mobiler Zusatzakku mit USB-C, 10.000 mAh, für den Alltag; ungefähr 30 €.", report: "Ein Smartphone lässt sich unterwegs nachladen. Der Ladestand wird angezeigt. Das vollständige Aufladen des Akkus dauert mehrere Stunden. Ein Ladekabel muss separat mitgenommen werden." },
  { id: "mat", name: "Trainings- und Yogamatte", icon: "mat", description: "Aufrollbare Matte mit Trageband für Dehnen und leichte Übungen; ungefähr 25 €.", report: "Die Oberfläche bietet auf trockenem Boden guten Halt. Die Matte lässt sich aufrollen und tragen. Bei Feuchtigkeit lässt die Griffigkeit nach. Für harte Böden fällt die Polsterung eher dünn aus." },
  { id: "bag", name: "Faltbarer Tagesrucksack", icon: "bag", description: "Leichter Rucksack mit 15 Litern Volumen für kleine Ausflüge; ungefähr 30 €.", report: "Der Rucksack lässt sich platzsparend verstauen. Eine Außentasche bietet schnellen Zugriff. Die Schultergurte sind nur leicht gepolstert. Bei starkem Regen kann Wasser eindringen." },
  { id: "game", name: "Kooperatives Kartenspiel", icon: "game", description: "Gemeinsames Kartenspiel für zwei bis fünf Personen, Spieldauer etwa 20 Minuten; ungefähr 25 €.", report: "Eine Runde dauert nur etwa zwanzig Minuten. Alle Personen arbeiten auf ein gemeinsames Ziel hin. Die ersten Partien erfordern Einarbeitung. Bei häufigem Spielen wiederholen sich manche Situationen." },
  { id: "lunch", name: "Lunchbox mit Trennfächern", icon: "lunch", description: "Wiederverwendbare Lunchbox mit zwei Fächern für Mahlzeiten unterwegs; ungefähr 25 €.", report: "Zwei Fächer halten feste Speisen getrennt. Der Behälter lässt sich in der Spülmaschine reinigen. Für Suppen ist die Box nicht auslaufsicher. Der Deckel darf nicht in die Mikrowelle." },
  { id: "plant", name: "Pflanzset für Küchenkräuter", icon: "plant", description: "Drei kleine Pflanzgefäße mit Substrat und Kräutersamen für die Fensterbank; ungefähr 25 €.", report: "Das Set enthält Gefäße, Substrat und Samen. Die Gefäße passen auf eine Fensterbank. Die Pflanzen benötigen regelmäßige Pflege. Bei wenig Tageslicht wachsen die Kräuter langsam." }
];
function product(id) { return PRODUCTS.find(p => p.id === id); }
function card(p) {
  return `<article class="product"><button type="button" class="product-image-button" data-product-image="${p.id}" aria-label="Bild vergrößern: ${p.name}" aria-haspopup="dialog"><img src="imgs/${p.icon}.jpg" alt="Beispielbild: ${p.name}"><span>Bild vergrößern</span></button><h2>${p.name}</h2><p>${p.description}</p></article>`;
}

// One shared modal outside the jsPsych display: opening it never submits a form.
const imageDialog = document.createElement("dialog");
imageDialog.className = "product-image-dialog";
imageDialog.setAttribute("aria-labelledby", "image-dialog-title");
imageDialog.innerHTML = `<div class="image-dialog-header"><h2 id="image-dialog-title"></h2><button type="button" class="primary-button image-dialog-close">Schließen</button></div><img alt="">`;
document.body.appendChild(imageDialog);
imageDialog.querySelector("button").addEventListener("click", () => imageDialog.close());
imageDialog.addEventListener("click", event => {
  if (event.target !== imageDialog) return;
  const rect = imageDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) imageDialog.close();
});
document.addEventListener("click", event => {
  const button = event.target.closest("[data-product-image]");
  if (!button) return;
  event.preventDefault(); // Also prevents the surrounding choice label selecting a radio.
  const p = product(button.dataset.productImage);
  const img = imageDialog.querySelector("img");
  img.src = `imgs/${p.icon}.jpg`;
  img.alt = `Großansicht: ${p.name}`;
  imageDialog.querySelector("h2").textContent = p.name;
  // jsPsych rebuilds the body during initialization; reattach the shared modal if needed.
  if (!imageDialog.isConnected) document.body.appendChild(imageDialog);
  imageDialog.showModal();
});
