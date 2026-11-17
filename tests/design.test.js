"use strict";
const assert = require("node:assert/strict");
const Design = require("../scripts/design.js");
const cfg = { anchorRange: [5,7], highGap: [.5,1.5], lowGap: [2,3.5] };
const conditions = ["high_info","high_noinfo","low_info","low_noinfo","gift"];
const shuffle = a => [...a].reverse();
for (let run = 0; run < 1000; run++) {
  const ratings = Object.fromEntries(Array.from({length:8}, (_, i) => [`p${i}`, Math.round((1 + Math.random()*7)*10)/10]));
  for (const condition of conditions) {
    const p = Design.select(ratings, condition, cfg);
    assert.ok(p.anchor in ratings);
    if (condition !== "gift") {
      assert.notEqual(p.anchor, p.other);
      assert.ok(ratings[p.anchor] >= ratings[p.other]);
      if (p.eligible) {
        const range = condition.startsWith("high") ? cfg.highGap : cfg.lowGap;
        assert.ok(p.gap >= range[0] && p.gap <= range[1]);
        assert.ok(ratings[p.anchor] >= 5 && ratings[p.anchor] <= 7);
      }
    }
    const reports = Design.reportIds(Object.keys(ratings), p, condition, shuffle);
    assert.equal(new Set(reports).size, 4);
    if (condition.endsWith("_noinfo")) { assert.ok(!reports.includes(p.anchor)); assert.ok(!reports.includes(p.other)); }
    else { assert.ok(reports.includes(p.anchor)); if (condition !== "gift") assert.ok(reports.includes(p.other)); }
  }
}
for (const value of [1, 4.5, 8]) {
  const ratings = Object.fromEntries(Array.from({length:8}, (_, i) => [`p${i}`, value]));
  for (const condition of conditions) assert.equal(Design.select(ratings, condition, cfg).eligible, false);
}
assert.deepEqual(Design.score({a:6,b:5}, {a:7,b:4}, "a", "b"), {chosen_change:1,rejected_change:-1,spreading:2});
assert.equal(Design.score({a:6}, {a:7}, "a", null).spreading, null);
console.log("Passed: 5,000 condition selections, report membership, ties/extremes, and scoring.");
