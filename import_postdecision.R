# Technische Aufbereitung; für die Seminaraufgaben muss diese Datei nicht bearbeitet werden.
# Keine Analysen, Plots oder Dateiausgaben. Originaldateien bleiben unverändert.
lese_postdecision <- function(data_dir) {
  packages <- c("readr", "dplyr", "tidyr")
  missing_packages <- packages[!vapply(packages, requireNamespace, logical(1), quietly = TRUE)]
  if (length(missing_packages)) stop("Bitte zuerst installieren: ", paste(missing_packages, collapse = ", "))
  suppressPackageStartupMessages({library(readr); library(dplyr); library(tidyr)})
  if (!dir.exists(data_dir)) stop("Datenordner nicht gefunden: ", data_dir)
  input_dir <- data_dir
  num <- function(x) suppressWarnings(as.numeric(x))
  flag <- function(x) { x <- tolower(trimws(as.character(x))); ifelse(x %in% c("true", "1"), TRUE, ifelse(x %in% c("false", "0"), FALSE, NA)) }
  first_value <- function(x) { x <- x[!is.na(x) & x != ""]; if (length(x)) x[1] else NA_character_ }

  files <- sort(list.files(input_dir, pattern = "\\.csv$", full.names = TRUE, ignore.case = TRUE))
  if (!length(files)) stop("Keine CSV-Dateien in: ", input_dir, ". Bitte Rohdaten dort ablegen.")
  required <- c("task", "vp_id", "session_id", "task_run_id", "trial_index", "event", "assigned_condition")
  read_one <- function(file) {
    x <- read_csv(file, col_types = cols(.default = col_character()), na = c("", "NA", "null"), show_col_types = FALSE, name_repair = "check_unique")
    if (!"task" %in% names(x) || !any(x$task == "postdecision", na.rm = TRUE)) { warning("Übersprungen (keine Postdecision-Datei): ", basename(file)); return(NULL) }
    if (length(setdiff(required, names(x)))) stop("Fehlende Pflichtspalten in ", basename(file), ": ", paste(setdiff(required, names(x)), collapse = ", "))
    x %>% filter(task == "postdecision") %>% mutate(source_file = basename(file), file_rows = n())
  }
  raw <- bind_rows(lapply(files, read_one))
  if (!nrow(raw)) stop("Keine passenden Postdecision-Daten gefunden.")
  optional <- c("item_id", "rating", "initial_rating", "chosen_id", "rejected_id", "report_ids", "manipulation_eligible", "selection_fallback", "actual_gap", "completed", "started_at", "task_version")
  for (name in setdiff(optional, names(raw))) raw[[name]] <- NA_character_
  if (any(is.na(raw$vp_id) | is.na(raw$session_id) | is.na(raw$task_run_id) | is.na(num(raw$trial_index)))) stop("Leere IDs oder ungültiger trial_index: Rohdaten prüfen.")
  keys <- c("vp_id", "session_id", "task_run_id")
  
  # Erneute Downloads desselben Laufs nicht als weitere Personen/Trials zählen.
  # Längster Export zuerst; abweichende Inhalte desselben Ereignisses führen zum Stop.
  compare_cols <- setdiff(names(raw), c("source_file", "file_rows"))
  conflicts <- raw %>% distinct(across(all_of(compare_cols))) %>% count(across(all_of(c(keys, "trial_index")))) %>% filter(n > 1)
  if (nrow(conflicts)) stop("Widersprüchliche Exporte desselben Laufs. Bitte die Rohdateien prüfen.")
  raw <- raw %>% arrange(desc(file_rows), source_file) %>% distinct(across(all_of(c(keys, "trial_index"))), .keep_all = TRUE)
  
  # Metadaten können wegen jsPsych addProperties auch auf frühen Zeilen stehen.
  runs <- raw %>% group_by(across(all_of(keys))) %>% summarise(
    condition = first_value(assigned_condition), chosen_id = first_value(chosen_id), rejected_id = first_value(rejected_id),
    report_ids = first_value(report_ids), manipulation_eligible = flag(first_value(manipulation_eligible)),
    selection_fallback = first_value(selection_fallback), initial_pair_gap = num(first_value(actual_gap)),
    started_at = first_value(started_at), task_version = first_value(task_version),
    completed = any(event == "debriefing" & flag(completed) %in% TRUE),
    source_files = paste(sort(unique(source_file)), collapse = " | "), .groups = "drop") %>%
    mutate(run_id = paste(vp_id, session_id, task_run_id, sep = "::"),
           choice_difficulty = case_when(grepl("^high_", condition) ~ "high", grepl("^low_", condition) ~ "low", condition == "gift" ~ "gift", TRUE ~ NA_character_),
           information = case_when(condition == "gift" ~ "gift_info", grepl("_noinfo$", condition) ~ "no_info", grepl("_info$", condition) ~ "info", TRUE ~ NA_character_))
  
  items <- c("speaker", "bottle", "powerbank", "mat", "bag", "game", "lunch", "plant")
  pre_names <- paste0("pre_", items)
  if (any(raw$event == "initial_ratings") && !all(pre_names %in% names(raw))) stop("Initiale Bewertungen fehlen als pre_<item>-Spalten.")
  for (name in setdiff(pre_names, names(raw))) raw[[name]] <- NA_character_
  pre <- raw %>% filter(event == "initial_ratings") %>% select(all_of(keys), trial_index, rt = any_of("rt"), all_of(pre_names)) %>%
    pivot_longer(all_of(pre_names), names_to = "item_id", names_prefix = "pre_", values_to = "rating") %>%
    mutate(timepoint = "pre", rating = num(rating), jspsych_trial_index = num(trial_index)) %>% select(-trial_index)
  if (!"rt" %in% names(pre)) pre$rt <- NA_character_
  pre <- pre %>% mutate(response_time_ms = num(rt), response_time_scope = "all_eight_ratings") %>% select(-rt)
  post <- raw %>% filter(event == "repeat_rating") %>% transmute(across(all_of(keys)), item_id, timepoint = "post", rating = num(rating), jspsych_trial_index = num(trial_index),
    response_time_ms = if ("rt" %in% names(raw)) num(rt) else NA_real_, response_time_scope = "single_item")
  ratings <- bind_rows(pre, post)
  if (any(!ratings$item_id %in% items)) stop("Unbekannte oder fehlende Artikel-ID in den Bewertungsdaten.")
  if (anyDuplicated(ratings[c(keys, "item_id", "timepoint")])) stop("Mehrfache Bewertungen je Artikel/Zeitpunkt innerhalb eines Laufs.")
  
  # Vollständiges Raster erhält Abbrüche/missing ratings sichtbar; keine Imputation.
  long <- runs %>% crossing(item_id = items, timepoint = c("pre", "post")) %>%
    left_join(ratings, by = c(keys, "item_id", "timepoint")) %>%
    mutate(rating_observed = !is.na(rating), rating_valid = !is.na(rating) & rating >= 1 & rating <= 8,
      rating_clean = if_else(rating_valid, rating, NA_real_),
      item_role = case_when(is.na(chosen_id) ~ NA_character_, item_id == chosen_id & condition == "gift" ~ "gift", item_id == chosen_id ~ "chosen", item_id == rejected_id ~ "rejected", TRUE ~ "unrelated"),
      report_seen = if_else(is.na(report_ids), NA, mapply(function(id, reports) id %in% strsplit(reports, "|", fixed = TRUE)[[1]], item_id, coalesce(report_ids, ""))),
      timepoint = factor(timepoint, levels = c("pre", "post"))) %>%
    arrange(vp_id, session_id, task_run_id, item_id, timepoint)
  return(long)
}
