# Domande agent (v0)

Come l'agent chiede ogni voce dello schema. Basato sulle domande dell'onboarding di Luca e sull'intake HR. Numeri delle voci come in "Schema bozza JD".

## Regole generali
- Una domanda per messaggio: o da scegliere con i pulsanti, o da scrivere.
- Mai chiedere una voce già coperta dal testo dell'utente o dal documento allegato: prima si estrae, poi si chiede.
- Tono: "tu", frasi corte, niente gergo HR.
- Ogni domanda ha risposte rapide quando le opzioni sono poche; l'utente può sempre scrivere libero.
- "Non lo so" o "salta": su una voce obbligatoria l'agent propone un valore ragionevole e lo segna come proposto; su una facoltativa la lascia vuota.
- Dopo le 11 obbligatorie l'agent chiede le facoltative in un solo messaggio ("Vuoi aggiungere anche…?"), mai una per una.
- Mai età, genere, stato civile o nazionalità. Se l'utente li scrive: "Non posso usarlo nell'annuncio; lo traduco in anni di esperienza?"

## Primo messaggio: diagnosi (voci 4 e 5)
Non è una domanda: l'agent legge il primo testo e propone il job title del catalogo e la seniority.
- Proposta: "Stai cercando un **[Job title]**, livello **[Seniority]**. Va bene?"
- Risposte rapide: "Sì, va bene" · "È più junior" · "È più senior" · "Scegli un altro ruolo" (junior e senior solo se il ruolo ha quel livello).
- "Scegli un altro ruolo": fino a 4 ruoli della stessa famiglia, oppure lo si descrive con parole proprie.
- Fuori catalogo: "Questo ruolo non è ancora nella mia libreria: scrivo comunque la JD."
- Ruolo non chiaro: "Quale ruolo stai cercando? Descrivimelo con parole tue."
- Attività di altri ruoli: restano nella JD, senza avvisi.
- Attività tutte di un altro ruolo del catalogo: "Quello che descrivi sembra più un **[B]** che un **[A]**. Vuoi cambiare ruolo?" Risposte rapide: "Passa a [B]" · "Resto su [A]". Un ruolo rifiutato non si ripropone.
- Coperta quando: l'utente conferma o sceglie.

## Obbligatorie

### 0 e 1 · Nome e descrizione azienda (priorità 1)
- Domanda unica: "Come si chiama la tua azienda e cosa fa, in due righe?" Se una delle due voci è già nota, si chiede solo l'altra.
- Coperta quando: c'è il nome; settore e attività principale sono chiari.
- Esempio: "Startup di economia circolare: recuperiamo scarti per aziende e comuni."

### 3 · Missione del ruolo (priorità 2)
- Domanda: "Perché assumi adesso?"
- Risposte rapide: "È un ruolo nuovo" · "Sostituisco qualcuno" · "Oggi lo facciamo da soli o con fornitori"
- Poi, se serve: "Cosa deve sbloccare questa persona?"
- Coperta quando: motivo + una frase di obiettivo.

### 7 · Attività (priorità 3)
- Domanda: "Cosa farà questa persona ogni settimana? E quali 2 o 3 cose sono le più critiche?"
- Coperta quando: almeno 3 attività, con le critiche indicate.

### 5 · Seniority (priorità 3, se la diagnosi non l'ha chiusa)
- Domanda: "Che livello cerchi? Pensa a cosa farà: eseguire, coordinare o avere la responsabilità di un'area."
- Risposte rapide: solo i livelli ammessi dal job title scelto (es. SDR: Junior, Mid).

### 6 · Team e riporto (priorità 4)
- Domanda: "In che team entra, quante persone ci sono e a chi riporta?"
- Coperta quando: riporto + dimensione del team.

### 9 · Risultati a 6 mesi (priorità 4)
- Domanda: "Tra 6 mesi, cosa deve aver ottenuto perché tu dica che è stata la scelta giusta? Due o tre cose concrete."
- Se la risposta è vaga ("che lavori bene"): "Puoi darmi qualcosa di misurabile? Es. un numero, un progetto chiuso, un risultato."
- Coperta quando: almeno 2 risultati concreti.

### 10 · Skill tecniche (priorità 5)
- Domanda: "Quali competenze tecniche servono dal primo giorno, e quali sono un plus?"
- Se il ruolo è in catalogo, l'agent propone le skill del profilo: "Per un [Job title] di solito servono: … Togli o aggiungi."
- Per le prime 3: "Che errore fa tipicamente chi non le ha?" (solo scheda interna)
- Coperta quando: almeno 3 skill, obbligatorie e plus distinte.

### 11 · Skill trasversali (priorità 5)
- Domanda: "Quali sono le 3 o 4 qualità personali che contano di più in questo ruolo, in ordine?"
- Risposte rapide (dal catalogo): 4–5 proposte cliccabili.
- Coperta quando: 1–4 skill in ordine.

### 13 · Sede e modalità (priorità 6)
- Domanda: "Dove lavora e come?"
- Risposte rapide: "In ufficio" · "Ibrido" · "Da remoto"
- Se ibrido: "Quanti giorni in ufficio?" Poi: "Ci sono trasferte?"
- Coperta quando: città + modalità.

### 14 · Contratto (priorità 7)
- Domanda: "Che tipo di contratto offri?"
- Risposte rapide: "Indeterminato" · "Determinato" · "Partita IVA" · "Stage"
- Facoltativo nella stessa domanda: CCNL e livello.
- Coperta quando: tipo di contratto.

## Facoltative (un solo messaggio a fine checklist)
"La JD è quasi pronta. Vuoi aggiungere anche una di queste cose?"
- 15 · RAL: "Range di RAL? Lo metto nell'annuncio o resta solo per te?"
- 16 · Cosa offri: "Benefit, formazione, smart working, crescita?"
- 12b · Lingue: "Lingue richieste e a che livello?"
- 12 · Requisiti eliminatori: "C'è qualcosa senza cui scarteresti anche il candidato perfetto?"
- 8 · KPI: "Su quali numeri lavora?"
- 17 · Processo di selezione: "Come funziona la selezione e in quanto tempo rispondi?"
- 2 · Mission e valori
- 18 · Note per te (solo scheda interna)

## Fine
- Checklist completa: "La JD è pronta 🎉 Puoi esportarla o chiedermi modifiche."
- Pari opportunità: aggiunta in fondo all'annuncio in automatico, nessuna domanda.
