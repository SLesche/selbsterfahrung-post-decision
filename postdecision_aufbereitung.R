# Postdecision-Aufgabe: Daten und eigene Analysen
# Arbeitsverzeichnis: Hauptordner der Aufgabe (mit data/ und r_scripts/).
# Alle unveränderten CSV-Downloads in data/ ablegen, dann diese zwei Zeilen ausführen.

source("r_scripts/import_postdecision.R")
daten <- lese_postdecision("data")

# daten: eine Zeile pro Person/Lauf × Artikel × Zeitpunkt (pre/post).
# vp_id = Person, run_id = Lauf, item_id = Artikel, condition = Bedingung,
# item_role = Artikelrolle, timepoint = Zeitpunkt, rating_clean = Bewertung (1–8).
# Fehlende Bewertungen bleiben NA. Analysewerte sind nicht vorberechnet.

# 1. Überblick: Wie viele Personen und Aufgabenläufe liegen vor?
#    Wie verteilen sie sich auf die Bedingungen? Gibt es fehlende Bewertungen?

# 2. Mittelwertsverteilung: Berechne die mittlere Erstbewertung jeder Person.
#    Wie lassen sich diese Mittelwerte grafisch darstellen?

# 3. Produktvergleich: Welche Artikel waren vor der Entscheidung besonders beliebt?
#    Stelle die Verteilungen ihrer Erstbewertungen in einer Abbildung gegenüber.

# 4. Vorher–Nachher: Wie verändern sich die Bewertungen gewählter und abgelehnter
#    Artikel? Entwickle einen Plot, der auch individuelle Veränderungen zeigt.

# 5. Spreading: Entwickle aus den Bewertungsänderungen ein Maß dafür, wie stark
#    gewählte und abgelehnte Artikel nach der Wahl auseinanderdriften.
#    Stelle seine Verteilung dar. Wie gehst du mit der Gift-Bedingung um?

# 6. Kontrollen: Vergleiche die Veränderungen mit zugeteilten und unbeteiligten
#    Artikeln. Welche Vergleiche sind für die Interpretation besonders hilfreich?

# 7. Bedingungen: Unterscheidet sich das Spreading nach Entscheidungsschwierigkeit
#    und zusätzlichen Informationen? Untersuche auch deren Zusammenspiel.
#    Wähle eine geeignete Grafik und, falls möglich, ein statistisches Verfahren.

# 8. Robustheit: Wie hängen eure Ergebnisse von unvollständigen Läufen,
#    nicht gelungenen Manipulationen und zunächst niedriger bewerteten gewählten
#    Artikeln ab? Begründe eure Entscheidungen und vergleiche Alternativen.
#    Welche Schlussfolgerungen über Dissonanz erlaubt dieses Design überhaupt?
