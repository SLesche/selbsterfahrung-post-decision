"use strict";
globalThis.StudySession = (() => {
  const params = new URLSearchParams(location.search);
  const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const vp = params.get("participant_id")?.trim() || `VP_${id()}`;
  const session = params.get("battery_session_id")?.trim() || id();
  return Object.freeze({
    metadata: () => ({ vp_id: vp, participant_id: vp, session_id: session, battery_session_id: session }),
    filename: () => `${encodeURIComponent(vp)}__${encodeURIComponent(session)}__postdecision.csv`
  });
})();
