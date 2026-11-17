"use strict";
// Pure functions, also usable by the Node verification script.
const Design = (() => {
  function pick(array, rng) { return array[Math.floor(rng() * array.length)]; }
  function select(ratings, condition, cfg, rng = Math.random) {
    const ids = Object.keys(ratings);
    const anchors = ids.filter(id => ratings[id] >= cfg.anchorRange[0] && ratings[id] <= cfg.anchorRange[1]);
    if (condition === "gift") {
      return { anchor: pick(anchors.length ? anchors : ids, rng), other: null, gap: null, eligible: !!anchors.length, fallback: anchors.length ? "none" : "no_anchor" };
    }
    const [min, max] = condition.startsWith("high") ? cfg.highGap : cfg.lowGap;
    const pairs = [];
    for (const a of ids) for (const b of ids) {
      if (a !== b && ratings[a] >= ratings[b]) {
        const gap = Math.round((ratings[a] - ratings[b]) * 1000) / 1000;
        pairs.push({ anchor: a, other: b, gap, eligible: anchors.includes(a) && gap >= min && gap <= max });
      }
    }
    const valid = pairs.filter(p => p.eligible);
    if (valid.length) return { ...pick(valid, rng), fallback: "none" };
    const target = (min + max) / 2;
    const distance = p => Math.abs(p.gap - target) + (anchors.includes(p.anchor) ? 0 : 10);
    const best = Math.min(...pairs.map(distance));
    return { ...pick(pairs.filter(p => Math.abs(distance(p) - best) < 1e-8), rng), fallback: "nearest_available_pair" };
  }
  function reportIds(ids, pair, condition, shuffle) {
    const target = condition === "gift" ? [pair.anchor] : condition.endsWith("_info") ? [pair.anchor, pair.other] : [];
    const unrelated = ids.filter(id => id !== pair.anchor && id !== pair.other);
    return shuffle([...target, ...shuffle(unrelated).slice(0, 4 - target.length)]);
  }
  function score(before, after, chosen, rejected) {
    const chosenChange = after[chosen] - before[chosen];
    const rejectedChange = rejected ? after[rejected] - before[rejected] : null;
    return { chosen_change: chosenChange, rejected_change: rejectedChange, spreading: rejected ? chosenChange - rejectedChange : null };
  }
  return { select, reportIds, score };
})();
if (typeof module !== "undefined") module.exports = Design;
