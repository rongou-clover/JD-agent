# Decisioni — JD Agent

Registro delle decisioni di progetto. Una riga per decisione, la più recente in fondo a ogni sezione.

## Perimetro
- 2026-10-22 · Progetto indipendente dalla Clover Platform, non dentro il monorepo.
- 2026-10-22 · Agent dimostrativo, senza login.
- 2026-10-22 · Cambio: accesso con un'unica password condivisa (sostituisce "senza login"); budget globale di uso applicato lato server, superato il quale l'agent si ferma per tutti.
- 2026-10-22 · Rinviati: allegati (U5) e "Chiedi di modificare" su un passaggio selezionato (U9).
- 2026-10-22 · Repo su GitHub in `rongou-clover`; ci lavora solo Rongou.
- 2026-10-22 · Catalogo dei job title in copia locale nel repo (file JSON), non letto dalla piattaforma.
- 2026-10-22 · Solo job title GTM: 15 job title in 5 job family (Sales, Customer, Marketing, Growth, GTM). Customer e GTM restano famiglie separate.
- 2026-10-22 · Richiesta fuori catalogo: l'agent lo dice e scrive comunque la JD, senza diagnosi né dimensioni consigliate.
- 2026-10-22 · Seniority da S1 a S3; i job title Manager ammessi a S3 e S4.

## Contenuto della JD
- 2026-10-22 · Checklist dell'agent costruita sulle domande dell'onboarding di Luca, integrate con l'intake HR; le voci di solo sourcing (aziende competitor, no touch, privacy) sono escluse.
- 2026-10-22 · Mai età, genere, stato civile o nazionalità; un vincolo di età si traduce in anni di esperienza o seniority.
- 2026-10-22 · Il business case non entra nella JD.
- 2026-10-22 · Urgenza, data di inizio e priorità tra più figure non sono domande dell'agent.
- 2026-10-22 · Terminologia del catalogo allineata al Framework e al Vocabolario Clover: job title, job family, seniority S1–S5, skill, P atteso, criticità, dimensioni consigliate.
- 2026-10-23 · Nuova voce obbligatoria 0 "Nome azienda", chiesta insieme alla descrizione; compare sotto il titolo e in "Chi siamo".
- 2026-10-23 · Testo fisso sulle pari opportunità: «Accogliamo candidature di persone di ogni genere, età, provenienza e orientamento, nel rispetto delle L. 903/77 e L. 125/91. Se non hai tutti i requisiti ma il ruolo ti interessa, candidati comunque. I dati saranno trattati secondo il Regolamento UE 2016/679 (GDPR).»
- 2026-10-23 · La scheda interna elenca, oltre alle skill citate dall'utente, le skill del catalogo per il ruolo non citate, con tipologia, criticità e P atteso, segnate come provenienti dal catalogo.
- 2026-10-23 · "Informazioni pratiche" compare solo con informazioni in più rispetto al riquadro di sintesi (orario, trasferte); non ripete sede, modalità né contratto.
- 2026-10-23 · Lunghezza dell'annuncio: l'obiettivo resta 500–700 parole, ma l'eval accetta da 450 quando la bozza ha poche informazioni; meglio corto che allungato con frasi vuote.

## Tecnica
- 2026-10-22 · Next.js + Mastra + Postgres.
- 2026-10-22 · Modelli tramite API Anthropic.
- 2026-10-22 · Deploy su Railway, infrastruttura descritta come codice nel repo.
- 2026-10-22 · Dominio: demo-agent.heyclover.it.
- 2026-10-22 · Architettura: workflow deterministico con tre agent (estrattore, diagnosi del ruolo, renderer), pianificatore delle domande e validatori in codice; lo stato è la bozza JD tipizzata.
- 2026-10-22 · Lingue con livello QCER come voce a sé dello schema (non obbligatoria).
- 2026-10-22 · Pari opportunità come testo fisso in fondo all'annuncio, senza domanda.
- 2026-10-22 · Risultati a 6 mesi restano obbligatori.
- 2026-10-22 · Skill trasversali: massimo 4.
- 2026-10-22 · Prerequisiti eliminatori sia nell'annuncio (sezione Requisiti) sia nella scheda interna.
- 2026-10-22 · Contenuti dell'annuncio dal template output, layout dal wireframe.
- 2026-10-22 · L'estrattore restituisce anche l'intento del messaggio (risposta, dicitura forzata, completa/abbellisci); restano tre agent.
- 2026-10-22 · Export PDF con la stampa del browser e un CSS di stampa dedicato.
- 2026-10-22 · Validatore anti-discriminazione con regex sui casi espliciti; il maschile grammaticale non è segnalato.
- 2026-10-22 · Validatore anti-discriminazione scritto ma spento (flag in codice): non ancora affidabile. Per ora la regola resta solo nei prompt degli agent.
- 2026-10-22 · Golden dataset completato con 10 casi fittizi (uno per famiglia più casi limite), scritti dall'agent e rivisti da Rongou.
- 2026-10-22 · Test end-to-end con Playwright, con screenshot e video per i test visivi.
- 2026-10-23 · Guard anti prompt injection: PromptInjectionDetector di Mastra con il modello veloce, una volta per messaggio prima degli agent. Blocca sopra 0,8 e blocca anche se il controllo fallisce. Nessun altro guardrail basato sul modello: l'output del renderer si controlla in codice.
- 2026-10-23 · Il workflow esegue un turno per messaggio e finisce; lo stato della conversazione vive nelle nostre tabelle Postgres (niente sospensione e ripresa di Mastra).
- 2026-10-23 · Limite d'uso giornaliero, per tutti gli utenti, espresso in token per modello e direzione (variabili DAILY_TOKENS_* in env), dimensionato per restare sotto i $5 al giorno ai prezzi di oggi. Niente tetto totale. Sostituisce il budget globale in dollari.
- 2026-10-23 · Sviluppo in tre filoni paralleli (renderer, backend, interfaccia) sopra contratti condivisi in src/render/contract.ts e src/api/contract.ts; l'interfaccia si rifinisce alla fine.
- 2026-10-23 · Prompt caching sul renderer rinviato a dopo il merge dei tre filoni.
- 2026-10-23 · Prompt caching attivo sul prompt del renderer: un annuncio intero passa da circa $0,06 a $0,02. Il limite giornaliero conta i token letti dalla cache a un decimo, come li fattura Anthropic.

## Esperienza utente
- 2026-10-22 · Home: sotto il titolo, un breve paragrafo che dice cosa serve all'agent per scrivere la JD.
- 2026-10-22 · Se l'utente chiede di completare o abbellire la JD con la checklist incompleta, l'agent ricorda cosa manca ma non blocca: sceglie l'utente.
- 2026-10-22 · Una dicitura forzata dall'utente vince sempre, tranne sulle regole anti-discriminazione; in quel caso l'agent spiega perché non la usa.
- 2026-10-22 · Il testo della JD non si modifica a mano: l'utente seleziona un passaggio e chiede in chat cosa cambiare, e l'agent lo riscrive.
- 2026-10-22 · Home e chat stanno ciascuna in una sola schermata, senza scorrimento, anche dentro chat e anteprima.
- 2026-10-22 · Template dell'output basato sull'analisi di 42 annunci GTM reali (vedi Template output JD e Corpus annunci).
- 2026-10-23 · Più ruoli in una richiesta: l'agent non chiede quale sia il principale, lo propone lui (quello che copre le attività più importanti) e nomina le attività chiave degli altri ruoli, che restano nella JD. Se nessun ruolo prevale avvisa che il profilo è difficile da trovare, e la scheda interna lo segnala.
- 2026-10-23 · L'anteprima della JD scorre solo al suo interno quando l'annuncio è lungo; la pagina resta senza scorrimento.
- 2026-10-23 · Se all'avvio serve la password, il testo scritto in Home viene conservato e rimesso nel campo dopo l'accesso.
- 2026-10-23 · Anche la chat scorre al suo interno per rileggere i messaggi precedenti, partendo sempre dall'ultimo; la pagina resta senza scorrimento.
- 2026-10-23 · In Home, in alto a destra, "Le tue JD" apre un riquadro con le chat iniziate da quel browser (codice anonimo in un cookie): ognuno vede solo le proprie. Niente cancellazione o rinomina per ora.
- 2026-10-23 · "Non lo so" o "decidi tu" su una voce obbligatoria: l'agent decide e propone un valore quando può ricavarlo dal ruolo e dal contesto (dal catalogo per le skill), e lo dice all'utente; se non può (nome azienda, sede, team, contratto), la voce resta da definire e l'agent va avanti senza richiederla.
- 2026-10-23 · Sopra l'anteprima due schede: "Annuncio" e "Scheda interna". "Esporta" riguarda solo l'annuncio.
- 2026-10-23 · Nella demo l'agent non chiede l'errore tipico delle skill né le trasferte.
- 2026-10-23 · Confermate le scelte del backend dove domande.md non diceva niente: domanda sulla seniority con pulsanti, il motivo cliccato vince su quello dedotto, qualità personali proposte dalle dimensioni consigliate del catalogo, testi nuovi in src/workflow/templates.
- 2026-10-23 · La demo va online su Railway (workspace Clover venture, progetto jd-agent), con deploy da GitHub a ogni push del branch phase-7-integration.
- 2026-10-23 · Una voce obbligatoria si chiede al massimo due volte di fila: alla terza l'agent fa come per "non lo so". Su una voce incompleta la domanda dice cosa manca, e la proposta dell'agent completa quello che l'utente ha dato.

## Fonti
- Documento di planning: "Agent Job Description — Planning" (tab Golden dataset e Catalogo job title GTM).
- Linear: CLO-187.
