# Schema bozza JD (v0)

Voci obbligatorie: 12 (0, 1, 3, 4, 5, 6, 7, 9, 10, 11, 13, 14).

Contratto unico tra estrattore, pianificatore, validatori e renderer. Ogni voce ha: valore, fonte (`utente` | `dedotto` | `catalogo`), stato (`mancante` | `proposto` | `confermato`).

Obbligatoria = serve per chiudere la checklist. Priorità = ordine in cui il pianificatore la chiede (1 = prima).

| # | Voce | Tipo | Valori / vincoli | Obbl. | Priorità |
|---|---|---|---|---|---|
| 0 | Nome azienda | testo | come lo scrive l'utente | sì | 1 |
| 1 | Descrizione azienda | testo | 1–4 frasi, senza il nome | sì | 1 |
| 2 | Mission e valori | testo | 1–3 frasi | no | 9 |
| 3 | Missione del ruolo (perché ora) | enum + testo | `nuovo` · `sostituzione` · `internalizzazione` + 1–2 frasi | sì | 2 |
| 4 | Job title | riferimento catalogo | id del catalogo oppure `fuori_catalogo` + testo | sì | 1 |
| 5 | Seniority | enum | `S1` · `S2` · `S3` · `S4` (S4 solo Manager) | sì | 3 |
| 6 | Team e riporto | oggetto | persone nel team (numero), riporta a (testo), dipartimenti (lista) | sì | 4 |
| 7 | Attività ricorrenti | lista | 3–8 voci; le 2–3 critiche marcate | sì | 3 |
| 8 | KPI | lista | 0–5 voci | no | 6 |
| 9 | Risultati a 6 mesi | lista | 2–3 voci concrete | sì | 4 |
| 10 | Skill tecniche | lista | skill (da catalogo o testo) · obbligatoria/nice to have · P atteso | sì | 5 |
| 11 | Skill trasversali | lista ordinata | max 4, in ordine di importanza | sì | 5 |
| 12 | Prerequisiti eliminatori | lista | max 5; tipo `esperienza` · `titolo` · `strumento` · `disponibilità` · `settore` | no | 7 |
| 12b | Lingue | lista | lingua + livello QCER (A1–C2, madrelingua) · obbligatoria/preferenziale | no | 6 |
| 13 | Sede e modalità | oggetto | città · `presenza` · `ibrido` (giorni in sede) · `remoto` · orario · trasferte | sì | 6 |
| 14 | Contratto | oggetto | `indeterminato` · `determinato` (mesi) · `partita_iva` · `stage` · CCNL e livello (opz.) | sì | 7 |
| 15 | RAL | oggetto | min · max · in annuncio sì/no | no | 8 |
| 16 | Cosa offre | lista | benefit, formazione, bonus, crescita, progetti | no | 8 |
| 17 | Processo di selezione | lista ordinata | step + tempi di risposta | no | 9 |
| 18 | Note dell'hiring manager | testo | solo scheda interna | no | — |

Regole di validazione:
- Nessuna voce contiene età, genere, stato civile o nazionalità.
- RAL mai nel testo libero: solo nel campo 15.
- `fuori_catalogo` → voci 10 e 11 senza P atteso, nessuna dimensione consigliata.
- Checklist completa = tutte le voci obbligatorie in stato `confermato` o `proposto`.

Output derivati:
- Annuncio: voci 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12b, 13, 14, 15 (se in annuncio), 16, 17, più in fondo il testo fisso sulle pari opportunità (L. 903/77, L. 125/91), senza domanda.
- Scheda interna: 4, 5, 10 con P atteso, 11, 12, 15, 18 + dimensioni consigliate dal catalogo.
