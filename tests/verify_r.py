"""Generate temporary teaching-data fixtures and exercise both R importers."""
import csv
import subprocess
import tempfile
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RSCRIPT = Path(r"C:\Program Files\R\R-4.5.3\bin\Rscript.exe")
ITEMS = ["speaker", "bottle", "powerbank", "mat", "bag", "game", "lunch", "plant"]

def write(path, rows):
    fields = list(dict.fromkeys(k for row in rows for k in row))
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fields)
        w.writeheader()
        w.writerows(rows)

with tempfile.TemporaryDirectory(prefix="seminar_r_") as directory:
    tmp = Path(directory)
    for task in ["postdecision", "flanker"]:
        folder = tmp / task
        (folder / "data").mkdir(parents=True)
        (folder / "r_scripts").mkdir()
        for person in range(1, 5):
            base = dict(task=task, vp_id=f"P{person}", session_id=f"S{person}", task_run_id=f"R{person}")
            rows = []
            if task == "postdecision":
                base.update(assigned_condition="gift" if person == 2 else "high_info", chosen_id="speaker", rejected_id="" if person == 2 else "bottle", report_ids="speaker|bottle|game|mat", manipulation_eligible="false" if person == 4 else "true", selection_fallback="none", actual_gap="1")
                rows.append(dict(base, trial_index=0, event="initial_ratings", rt="35000", **{f"pre_{item}": 6 if i == 0 else 5 for i, item in enumerate(ITEMS)}))
                for i, item in enumerate(ITEMS[:4] if person == 3 else ITEMS):
                    rows.append(dict(base, trial_index=i+1, event="repeat_rating", item_id=item, rating=(7 if i == 0 else 4), initial_rating=6 if i == 0 else 5, rt="1200"))
                if person != 3:
                    rows.append(dict(base, trial_index=9, event="debriefing", completed="true"))
            else:
                base.update(testing_mode="true" if person == 2 else "false", response_window_ms="3000", configured_blocks="2", actual_trials_per_block="4")
                rows.append(dict(base, event="fixation", trial_index=0))
                rows.append(dict(base, event="response", phase="practice", block=0, trial_in_block=1, practice_attempt=1, trial_index=1, congruent="true", target_direction="left", correct_response="d", response="d", rt=400, correct="true", omission="false"))
                for i in range(4 if person == 3 else 8):
                    response = "null" if i == 1 else "l" if i == 2 else "d"
                    rows.append(dict(base, event="response", phase="main", block=1 + i//4, trial_in_block=i % 4 + 1, trial_index=i+2, congruent="true" if i % 2 == 0 else "false", target_direction="left", correct_response="d", response=response, rt="null" if i == 1 else 90 if i == 0 else 400+i*10, correct="true" if response == "d" else "false", omission="true" if response == "null" else "false"))
            write(folder / "data" / f"p{person}.csv", rows)
            if person == 1:
                write(folder / "data" / "p1_redownload.csv", rows)
        for name in [f"{task}_aufbereitung.R", f"import_{task}.R"]:
            shutil.copy(ROOT / "r_scripts" / name, folder / "r_scripts" / name)
        assertions = (
            'stopifnot(nrow(daten) == 64, sum(daten$rating_clean == 7, na.rm=TRUE) == 4, '
            'sum(is.na(daten$rating_clean)) == 4, !any(c("spreading", "change_from_pre", "analysis_eligible") %in% names(daten)))'
            if task == "postdecision" else
            'stopifnot(nrow(daten) == 32, sum(daten$omission) == 4, '
            'sum(daten$rt_ms == 90, na.rm=TRUE) == 4, '
            '!any(c("previous_congruency", "use_for_rt", "main_accuracy") %in% names(daten)))'
        )
        driver = folder / "check.R"
        driver.write_text(
            f'setwd("{folder.as_posix()}")\n'
            f'source("r_scripts/{task}_aufbereitung.R")\n'
            'stopifnot(exists("daten"), dplyr::n_distinct(daten$vp_id) == 4)\n'
            + assertions + '\n'
            'stopifnot(setequal(ls(), c("daten", "lese_' + task + '")))\n', encoding="utf-8")
        before = set(folder.rglob("*"))
        result = subprocess.run([str(RSCRIPT), str(driver)], capture_output=True, text=True, encoding="utf-8", errors="replace")
        if result.returncode:
            print(result.stdout, result.stderr)
            raise RuntimeError(f"R execution failed for {task}")
        assert set(folder.rglob("*")) == before, "Import must not write files or create folders"
        print(f"PASS {task}: two-line entry, clean long data only, no analyses, no file writes")
