# Golden dataset

Casi di riferimento per gli scorer (`src/evals/`). Un file JSON per caso in `cases/`: il primo messaggio dell'utente e cosa ci si aspetta da diagnosi ed estrazione. `human-maple.md` è la JD completa del caso reale, riferimento per il renderer.

Formato di `expected`:
- `diagnosis`: ruolo e seniority ammesse (o più ruoli, principale per primo, o fuori catalogo).
- `fields`: voci che l'estrattore deve riempire dal testo; `present`, `equals`, `includes` (testo contenuto, senza maiuscole) o `minItems`.
- `absent`: voci che non sono nel testo; se l'estrattore le riempie, sta inventando.
- `mustNotContain`: testo che non deve finire in nessuna voce.

Scorer: diagnosi corretta, voci estratte correttamente, nessuna domanda su voci già coperte.

| # | Caso | Diagnosi attesa | Voci attese | Cosa verifica |
|---|---|---|---|---|
| 01 | SDR alla prima esperienza in un SaaS | sdr · S1 | 6 | Ruolo singolo chiaro, seniority bassa dichiarata, molte voci obbligatorie già presenti. |
| 02 | Account Executive senior, testo quasi completo | account-executive · S3 | 11 | Testo ricco: l'agent deve chiedere pochissimo. RAL dichiarata ma non da pubblicare. |
| 03 | Customer Success Manager da remoto | customer-success-manager · S2 | 3 | Testo medio: mancano contratto, risultati, team. Remoto senza città. |
| 04 | Content & Social Media Manager con video e grafica | content-social-media-manager · S2 | 4 | Dal caso reale Human Maple: tre mestieri in uno, ma solo il social è nel catalogo. L'agent propone il ruolo principale e dice che la richiesta è ibrida. |
| 05 | Una riga sola | performance-marketing-specialist · S1/S2/S3 | 0 | Input minimo: nessuna voce va inventata, la seniority è una proposta qualsiasi ammessa. |
| 06 | Un commerciale che fa tutto | più ruoli: account-executive, customer-success-manager · S2/S3 | 3 | Più ruoli in uno: il principale è l'Account Executive (chiude i contratti), poi Customer Success. |
| 07 | Head of GTM che gestisce persone | gtm-manager · S4 | 7 | Titolo diverso dal catalogo (Head of GTM) che va ricondotto a GTM Manager S4. |
| 08 | Office Manager, fuori catalogo | fuori catalogo | 4 | Ruolo non GTM: l'agent lo dice e scrive comunque la JD. |
| 09 | Annuncio esistente incollato | partnership-manager · S2/S3 | 13 | L'utente incolla un annuncio completo: quasi tutto va estratto, la RAL va solo nel campo 15. |
| 10 | BDR con richieste discriminatorie | bdr · S1 | 4 | Età, genere, nazionalità e figli non devono finire in nessuna voce della bozza. |
