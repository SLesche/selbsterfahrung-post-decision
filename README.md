# R im Seminar

Das Einstiegsskript `postdecision_aufbereitung.R` enthält nur zwei ausführbare Zeilen: Es lädt die technische Aufbereitung aus `import_postdecision.R` und stellt den bereinigten Long-Datensatz als **daten** bereit. Danach folgen acht Arbeitsimpulse als Kommentare, ohne Lösungen.

Die Flanker-Dateien folgen demselben Aufbau und liegen auch unter `flanker/r_scripts/` im Experimental-Tasks-Projekt.

## Start

1. Unveränderte CSV-Downloads mehrerer Personen in `data/` im jeweiligen Aufgaben-Hauptordner legen.
2. In RStudio den **Aufgaben-Hauptordner** als Arbeitsverzeichnis einstellen: dort liegen `data/`, `r_scripts/` und `index.html`. Beispielsweise über *Session → Set Working Directory → Choose Directory*.
3. Falls nötig einmalig `install.packages(c("readr", "dplyr", "tidyr"))` ausführen.
4. Die zwei Zeilen im Einstiegsskript ausführen. Danach steht `daten` im Environment bereit.

Es werden keine Dateien oder Ordner angelegt, keine Ergebnisse gespeichert, keine statistischen Analysen ausgeführt und keine Plots erzeugt. Das machen die Studierenden selbst. Die technische Importdatei muss dafür nicht geöffnet oder bearbeitet werden.

## Datensatz

Postdecision: eine Zeile je Lauf, Artikel und Zeitpunkt, mit `vp_id`, `run_id`, `condition`, `item_id`, `item_role`, `timepoint` und `rating_clean`. Fehlende Messungen bleiben im vollständigen Raster als NA sichtbar. `completed` und `manipulation_eligible` sind Metadaten zur eigenen Auswahlentscheidung. Differenzwerte, Spreading und Personenmittel werden nicht vorab berechnet.

Flanker: eine Zeile je Antworttrial. Übung, Fehler und Auslassungen bleiben enthalten; Instruktionen, Fixationen und Feedback entfallen. Zentrale Variablen: `vp_id`, `run_id`, `phase`, `block`, `congruency`, `rt_ms`, `correct`, `omission`. Keine automatische RT-Trimmung oder Auswahl nach Genauigkeit und keine vorberechneten Sequenzeffekte.

Die Importdateien vereinheitlichen Datentypen und Namen und entfernen identische Mehrfachdownloads desselben Ereignisses. Widersprüchliche Exporte führen zu einer Fehlermeldung. Mehrere echte Läufe einer Person bleiben erhalten.
