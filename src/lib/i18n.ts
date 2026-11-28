// Browser-safe interface language layer. Family-written content (greetings, reminders,
// notes) always stays in the family's own words; only the app's own wording is translated.
export const LANGUAGES = ['en', 'de', 'es', 'fr', 'it', 'pt', 'nl', 'pl', 'uk', 'ru', 'tr', 'ar', 'hi', 'zh', 'ja', 'ko'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Native names, so a family recognises their own language without reading English. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano', pt: 'Português',
  nl: 'Nederlands', pl: 'Polski', uk: 'Українська', ru: 'Русский', tr: 'Türkçe', ar: 'العربية',
  hi: 'हिन्दी', zh: '中文', ja: '日本語', ko: '한국어',
};
const RIGHT_TO_LEFT: readonly Language[] = ['ar'];

export type Strings = {
  navToday: string; navRoutines: string; navPeople: string; navCheckins: string; navHistory: string; navSettings: string;
  lovedOneView: string; signOut: string; familyWorkspace: string; connectGlasses: string;
  morningFallback: string; nothingPlanned: string; quietNow: string; breakActive: string;
  statePending: string; stateDone: string; statePostponed: string; stateHelp: string; stateDeclined: string;
  actDone: string; actLater: string; actHelp: string; actNotToday: string; actShowAgain: string; actWhatNext: string; actNextStep: string;
  routineSection: string; familiarSection: string; askSection: string; askPlaceholder: string; callPerson: string; stepOf: string; allStepsDone: string;
  footerCompanion: string; prepInMinutes: string;
  g2Today: string; g2Important: string; g2Done: string; g2Earlier: string; g2FamilyNote: string; g2Microphone: string; g2Listening: string; g2Release: string;
  g2AllDone: string; g2TapDone: string; g2NotDue: string; g2TapNext: string; g2DoubleTapToday: string; g2HelpRequested: string;
  g2NotTodayConfirmed: string; g2ALittleLater: string; g2StillToDo: string; g2InMin: string; g2AllSteps: string;
};

const en: Strings = {
  navToday: 'Today', navRoutines: 'Routines', navPeople: 'Familiar people', navCheckins: 'Check-ins', navHistory: 'Change history', navSettings: 'Settings',
  lovedOneView: 'Loved One view', signOut: 'Sign out', familyWorkspace: 'Family workspace', connectGlasses: 'Connect G2 glasses',
  morningFallback: 'A little support for {name}.', nothingPlanned: 'Nothing planned. Take your time.', quietNow: 'Ordinary prompts are quiet right now.', breakActive: 'A planned break is active. Family fallback notices continue.',
  statePending: 'Not confirmed', stateDone: 'Confirmed', statePostponed: 'A little later', stateHelp: 'Help requested', stateDeclined: 'Not today',
  actDone: 'Done', actLater: 'A little later', actHelp: 'I need help', actNotToday: 'Not today', actShowAgain: 'Show again', actWhatNext: 'What happens next?', actNextStep: 'Next step',
  routineSection: 'A familiar routine', familiarSection: 'Someone familiar', askSection: 'Ask a question', askPlaceholder: 'Who is Anna?', callPerson: 'Call {name}', stepOf: '{step} of {total}', allStepsDone: 'All steps confirmed. Take your time.',
  footerCompanion: 'Keep this companion open for prompts. No guaranteed background alerts. Voice recognition is not connected.', prepInMinutes: 'In {n} minutes: {title}',
  g2Today: 'TODAY', g2Important: 'IMPORTANT', g2Done: 'DONE', g2Earlier: 'EARLIER', g2FamilyNote: 'FAMILY NOTE', g2Microphone: 'MICROPHONE', g2Listening: 'Listening locally', g2Release: 'Release to stop',
  g2AllDone: 'All done. Thank you.', g2TapDone: 'Tap = done', g2NotDue: 'Not due yet', g2TapNext: 'Tap = next step', g2DoubleTapToday: 'Double tap = today', g2HelpRequested: 'Help requested',
  g2NotTodayConfirmed: 'Not today · not confirmed', g2ALittleLater: 'A little later', g2StillToDo: 'Still to do? Tap = done', g2InMin: 'In {n} min', g2AllSteps: 'All steps confirmed.',
};
const de: Strings = {
  navToday: 'Heute', navRoutines: 'Abläufe', navPeople: 'Vertraute Personen', navCheckins: 'Nachrichten', navHistory: 'Änderungsverlauf', navSettings: 'Einstellungen',
  lovedOneView: 'Angehörigen-Ansicht', signOut: 'Abmelden', familyWorkspace: 'Familienbereich', connectGlasses: 'G2-Brille verbinden',
  morningFallback: 'Ein wenig Unterstützung für {name}.', nothingPlanned: 'Nichts geplant. Lassen Sie sich Zeit.', quietNow: 'Normale Hinweise sind gerade leise.', breakActive: 'Eine geplante Pause ist aktiv. Familien-Hinweise bleiben erhalten.',
  statePending: 'Nicht bestätigt', stateDone: 'Bestätigt', statePostponed: 'Ein wenig später', stateHelp: 'Hilfe angefordert', stateDeclined: 'Heute nicht',
  actDone: 'Erledigt', actLater: 'Ein wenig später', actHelp: 'Ich brauche Hilfe', actNotToday: 'Heute nicht', actShowAgain: 'Nochmal zeigen', actWhatNext: 'Was kommt als Nächstes?', actNextStep: 'Nächster Schritt',
  routineSection: 'Ein vertrauter Ablauf', familiarSection: 'Jemand Vertrautes', askSection: 'Eine Frage stellen', askPlaceholder: 'Wer ist Anna?', callPerson: '{name} anrufen', stepOf: '{step} von {total}', allStepsDone: 'Alle Schritte bestätigt. Lassen Sie sich Zeit.',
  footerCompanion: 'Lassen Sie diese Begleitung geöffnet für Hinweise. Keine garantierten Hintergrund-Meldungen. Spracherkennung ist nicht verbunden.', prepInMinutes: 'In {n} Minuten: {title}',
  g2Today: 'HEUTE', g2Important: 'WICHTIG', g2Done: 'ERLEDIGT', g2Earlier: 'FRÜHER', g2FamilyNote: 'FAMILIENNOTIZ', g2Microphone: 'MIKROFON', g2Listening: 'Lokal aufnehmen', g2Release: 'Loslassen zum Stoppen',
  g2AllDone: 'Alles erledigt. Danke.', g2TapDone: 'Tippen = erledigt', g2NotDue: 'Noch nicht fällig', g2TapNext: 'Tippen = nächster Schritt', g2DoubleTapToday: 'Doppeltippen = heute', g2HelpRequested: 'Hilfe angefordert',
  g2NotTodayConfirmed: 'Heute nicht · nicht bestätigt', g2ALittleLater: 'Ein wenig später', g2StillToDo: 'Noch offen? Tippen = erledigt', g2InMin: 'In {n} Min.', g2AllSteps: 'Alle Schritte bestätigt.',
};
const es: Strings = {
  navToday: 'Hoy', navRoutines: 'Rutinas', navPeople: 'Personas conocidas', navCheckins: 'Avisos', navHistory: 'Historial de cambios', navSettings: 'Ajustes',
  lovedOneView: 'Vista de la persona querida', signOut: 'Cerrar sesión', familyWorkspace: 'Espacio familiar', connectGlasses: 'Conectar gafas G2',
  morningFallback: 'Un poco de apoyo para {name}.', nothingPlanned: 'Nada previsto. Tómate tu tiempo.', quietNow: 'Los avisos normales están en silencio ahora.', breakActive: 'Hay una pausa programada. Los avisos a la familia continúan.',
  statePending: 'Sin confirmar', stateDone: 'Confirmado', statePostponed: 'Un poco más tarde', stateHelp: 'Ayuda solicitada', stateDeclined: 'Hoy no',
  actDone: 'Hecho', actLater: 'Un poco más tarde', actHelp: 'Necesito ayuda', actNotToday: 'Hoy no', actShowAgain: 'Mostrar otra vez', actWhatNext: '¿Qué sigue?', actNextStep: 'Siguiente paso',
  routineSection: 'Una rutina conocida', familiarSection: 'Alguien conocido', askSection: 'Haz una pregunta', askPlaceholder: '¿Quién es Anna?', callPerson: 'Llamar a {name}', stepOf: '{step} de {total}', allStepsDone: 'Todos los pasos confirmados. Tómate tu tiempo.',
  footerCompanion: 'Mantén esta compañía abierta para ver avisos. No hay alertas garantizadas en segundo plano. El reconocimiento de voz no está conectado.', prepInMinutes: 'En {n} minutos: {title}',
  g2Today: 'HOY', g2Important: 'IMPORTANTE', g2Done: 'HECHO', g2Earlier: 'ANTES', g2FamilyNote: 'NOTA FAMILIAR', g2Microphone: 'MICRÓFONO', g2Listening: 'Escuchando en el dispositivo', g2Release: 'Suelta para detener',
  g2AllDone: 'Todo hecho. Gracias.', g2TapDone: 'Tocar = hecho', g2NotDue: 'Aún no es la hora', g2TapNext: 'Tocar = siguiente paso', g2DoubleTapToday: 'Doble toque = hoy', g2HelpRequested: 'Ayuda solicitada',
  g2NotTodayConfirmed: 'Hoy no · sin confirmar', g2ALittleLater: 'Un poco más tarde', g2StillToDo: '¿Pendiente? Tocar = hecho', g2InMin: 'En {n} min', g2AllSteps: 'Todos los pasos confirmados.',
};
const fr: Strings = {
  navToday: 'Aujourd’hui', navRoutines: 'Routines', navPeople: 'Personnes connues', navCheckins: 'Pointages', navHistory: 'Historique des modifications', navSettings: 'Réglages',
  lovedOneView: 'Vue de la personne chère', signOut: 'Se déconnecter', familyWorkspace: 'Espace familial', connectGlasses: 'Connecter les lunettes G2',
  morningFallback: 'Un peu de soutien pour {name}.', nothingPlanned: 'Rien de prévu. Prenez votre temps.', quietNow: 'Les rappels ordinaires sont silencieux pour l’instant.', breakActive: 'Une pause planifiée est active. Les messages à la famille continuent.',
  statePending: 'Non confirmé', stateDone: 'Confirmé', statePostponed: 'Un peu plus tard', stateHelp: 'Aide demandée', stateDeclined: 'Pas aujourd’hui',
  actDone: 'Fait', actLater: 'Un peu plus tard', actHelp: 'J’ai besoin d’aide', actNotToday: 'Pas aujourd’hui', actShowAgain: 'Afficher encore', actWhatNext: 'Que se passe-t-il ensuite ?', actNextStep: 'Étape suivante',
  routineSection: 'Une routine familière', familiarSection: 'Quelqu’un de familier', askSection: 'Poser une question', askPlaceholder: 'Qui est Anna ?', callPerson: 'Appeler {name}', stepOf: '{step} sur {total}', allStepsDone: 'Toutes les étapes sont confirmées. Prenez votre temps.',
  footerCompanion: 'Gardez cet accompagnement ouvert pour voir les rappels. Aucune alerte en arrière-plan n’est garantie. La reconnaissance vocale n’est pas connectée.', prepInMinutes: 'Dans {n} minutes : {title}',
  g2Today: 'AUJOURD’HUI', g2Important: 'IMPORTANT', g2Done: 'FAIT', g2Earlier: 'PLUS TÔT', g2FamilyNote: 'NOTE FAMILIALE', g2Microphone: 'MICRO', g2Listening: 'Écoute locale', g2Release: 'Relâchez pour arrêter',
  g2AllDone: 'Tout est fait. Merci.', g2TapDone: 'Taper = fait', g2NotDue: 'Pas encore l’heure', g2TapNext: 'Taper = étape suivante', g2DoubleTapToday: 'Double tap = aujourd’hui', g2HelpRequested: 'Aide demandée',
  g2NotTodayConfirmed: 'Pas aujourd’hui · non confirmé', g2ALittleLater: 'Un peu plus tard', g2StillToDo: 'À faire ? Taper = fait', g2InMin: 'Dans {n} min', g2AllSteps: 'Toutes les étapes sont confirmées.',
};
const it: Strings = {
  navToday: 'Oggi', navRoutines: 'Rutine', navPeople: 'Persone care', navCheckins: 'Verifiche', navHistory: 'Cronologia modifiche', navSettings: 'Impostazioni',
  lovedOneView: 'Vista della persona cara', signOut: 'Esci', familyWorkspace: 'Spazio familiare', connectGlasses: 'Collega gli occhiali G2',
  morningFallback: 'Un po’ di supporto per {name}.', nothingPlanned: 'Niente di previsto. Con calma.', quietNow: 'I promemoria ordinari sono silenziosi in questo momento.', breakActive: 'Una pausa programmata è attiva. Gli avvisi alla famiglia continuano.',
  statePending: 'Non confermato', stateDone: 'Confermato', statePostponed: 'Un po’ più tardi', stateHelp: 'Aiuto richiesto', stateDeclined: 'Oggi no',
  actDone: 'Fatto', actLater: 'Un po’ più tardi', actHelp: 'Ho bisogno di aiuto', actNotToday: 'Oggi no', actShowAgain: 'Mostra di nuovo', actWhatNext: 'Cosa viene dopo?', actNextStep: 'Passo successivo',
  routineSection: 'Una routine familiare', familiarSection: 'Qualcuno di familiare', askSection: 'Fai una domanda', askPlaceholder: 'Chi è Anna?', callPerson: 'Chiama {name}', stepOf: '{step} di {total}', allStepsDone: 'Tutti i passi sono confermati. Con calma.',
  footerCompanion: 'Tieni aperta questa compagnia per vedere i promemoria. Nessun avviso in background garantito. Il riconoscimento vocale non è collegato.', prepInMinutes: 'Tra {n} minuti: {title}',
  g2Today: 'OGGI', g2Important: 'IMPORTANTE', g2Done: 'FATTO', g2Earlier: 'PRIMA', g2FamilyNote: 'NOTA FAMILIARE', g2Microphone: 'MICROFONO', g2Listening: 'Ascolto locale', g2Release: 'Rilascia per fermare',
  g2AllDone: 'Tutto fatto. Grazie.', g2TapDone: 'Tocca = fatto', g2NotDue: 'Non ancora in orario', g2TapNext: 'Tocca = passo successivo', g2DoubleTapToday: 'Doppio tocco = oggi', g2HelpRequested: 'Aiuto richiesto',
  g2NotTodayConfirmed: 'Oggi no · non confermato', g2ALittleLater: 'Un po’ più tardi', g2StillToDo: 'Da fare? Tocca = fatto', g2InMin: 'Tra {n} min', g2AllSteps: 'Tutti i passi sono confermati.',
};
const pt: Strings = {
  navToday: 'Hoje', navRoutines: 'Rotinas', navPeople: 'Pessoas queridas', navCheckins: 'Avisos', navHistory: 'Histórico de alterações', navSettings: 'Definições',
  lovedOneView: 'Vista da pessoa querida', signOut: 'Terminar sessão', familyWorkspace: 'Espaço da família', connectGlasses: 'Ligar óculos G2',
  morningFallback: 'Um pouco de apoio para {name}.', nothingPlanned: 'Nada previsto. Com calma.', quietNow: 'Os avisos normais estão silenciosos agora.', breakActive: 'Uma pausa programada está ativa. Os avisos à família continuam.',
  statePending: 'Não confirmado', stateDone: 'Confirmado', statePostponed: 'Um pouco mais tarde', stateHelp: 'Ajuda pedida', stateDeclined: 'Hoje não',
  actDone: 'Feito', actLater: 'Um pouco mais tarde', actHelp: 'Preciso de ajuda', actNotToday: 'Hoje não', actShowAgain: 'Mostrar outra vez', actWhatNext: 'O que vem a seguir?', actNextStep: 'Passo seguinte',
  routineSection: 'Uma rotina familiar', familiarSection: 'Alguém conhecido', askSection: 'Faça uma pergunta', askPlaceholder: 'Quem é a Anna?', callPerson: 'Ligar para {name}', stepOf: '{step} de {total}', allStepsDone: 'Todos os passos confirmados. Com calma.',
  footerCompanion: 'Mantenha esta companhia aberta para ver avisos. Sem alertas em segundo plano garantidos. O reconhecimento de voz não está ligado.', prepInMinutes: 'Em {n} minutos: {title}',
  g2Today: 'HOJE', g2Important: 'IMPORTANTE', g2Done: 'FEITO', g2Earlier: 'ANTES', g2FamilyNote: 'NOTA DA FAMÍLIA', g2Microphone: 'MICROFONE', g2Listening: 'A ouvir localmente', g2Release: 'Solte para parar',
  g2AllDone: 'Tudo feito. Obrigado.', g2TapDone: 'Tocar = feito', g2NotDue: 'Ainda não é hora', g2TapNext: 'Tocar = passo seguinte', g2DoubleTapToday: 'Toque duplo = hoje', g2HelpRequested: 'Ajuda pedida',
  g2NotTodayConfirmed: 'Hoje não · não confirmado', g2ALittleLater: 'Um pouco mais tarde', g2StillToDo: 'Por fazer? Tocar = feito', g2InMin: 'Em {n} min', g2AllSteps: 'Todos os passos confirmados.',
};
const nl: Strings = {
  navToday: 'Vandaag', navRoutines: 'Routines', navPeople: 'Vertrouwde mensen', navCheckins: 'Check-ins', navHistory: 'Wijzigingsgeschiedenis', navSettings: 'Instellingen',
  lovedOneView: 'Weergave voor uw dierbare', signOut: 'Afmelden', familyWorkspace: 'Familieruimte', connectGlasses: 'G2-bril verbinden',
  morningFallback: 'Even steun voor {name}.', nothingPlanned: 'Niets gepland. Neem de tijd.', quietNow: 'Gewone herinneringen zijn nu stil.', breakActive: 'Er is een geplande pauze. Berichten aan de familie gaan door.',
  statePending: 'Niet bevestigd', stateDone: 'Bevestigd', statePostponed: 'Even later', stateHelp: 'Hulp gevraagd', stateDeclined: 'Vandaag niet',
  actDone: 'Klaar', actLater: 'Even later', actHelp: 'Ik heb hulp nodig', actNotToday: 'Vandaag niet', actShowAgain: 'Nog eens tonen', actWhatNext: 'Wat komt er daarna?', actNextStep: 'Volgende stap',
  routineSection: 'Een vertrouwde routine', familiarSection: 'Iemand vertrouwd', askSection: 'Stel een vraag', askPlaceholder: 'Wie is Anna?', callPerson: '{name} bellen', stepOf: '{step} van {total}', allStepsDone: 'Alle stappen bevestigd. Neem de tijd.',
  footerCompanion: 'Houd deze begeleiding open voor herinneringen. Geen gegarandeerde meldingen op de achtergrond. Spraakherkenning is niet verbonden.', prepInMinutes: 'Over {n} minuten: {title}',
  g2Today: 'VANDAAG', g2Important: 'BELANGRIJK', g2Done: 'KLAAR', g2Earlier: 'EERDER', g2FamilyNote: 'FAMILIENOTITIE', g2Microphone: 'MICROFOON', g2Listening: 'Lokaal luisteren', g2Release: 'Laat los om te stoppen',
  g2AllDone: 'Alles klaar. Dank je.', g2TapDone: 'Tik = klaar', g2NotDue: 'Nog niet toe', g2TapNext: 'Tik = volgende stap', g2DoubleTapToday: 'Dubbeltik = vandaag', g2HelpRequested: 'Hulp gevraagd',
  g2NotTodayConfirmed: 'Vandaag niet · niet bevestigd', g2ALittleLater: 'Even later', g2StillToDo: 'Nog te doen? Tik = klaar', g2InMin: 'Over {n} min', g2AllSteps: 'Alle stappen bevestigd.',
};
const pl: Strings = {
  navToday: 'Dziś', navRoutines: 'Rytuały', navPeople: 'Znajome osoby', navCheckins: 'Zgłoszenia', navHistory: 'Historia zmian', navSettings: 'Ustawienia',
  lovedOneView: 'Widok dla bliskiej osoby', signOut: 'Wyloguj', familyWorkspace: 'Przestrzeń rodziny', connectGlasses: 'Połącz okulary G2',
  morningFallback: 'Odrobina wsparcia dla {name}.', nothingPlanned: 'Nic nie jest zaplanowane. Spokojnie.', quietNow: 'Zwykłe przypomnienia są teraz wyciszone.', breakActive: 'Trwa zaplanowana przerwa. Wiadomości do rodziny nadal docierają.',
  statePending: 'Niepotwierdzone', stateDone: 'Potwierdzone', statePostponed: 'Chwilę później', stateHelp: 'Poproszono o pomoc', stateDeclined: 'Dzisiaj nie',
  actDone: 'Gotowe', actLater: 'Chwilę później', actHelp: 'Potrzebuję pomocy', actNotToday: 'Dzisiaj nie', actShowAgain: 'Pokaż jeszcze raz', actWhatNext: 'Co dalej?', actNextStep: 'Następny krok',
  routineSection: 'Znany rytuał', familiarSection: 'Ktoś znajomy', askSection: 'Zadaj pytanie', askPlaceholder: 'Kim jest Anna?', callPerson: 'Zadzwoń: {name}', stepOf: '{step} z {total}', allStepsDone: 'Wszystkie kroki potwierdzone. Spokojnie.',
  footerCompanion: 'Trzymaj tę aplikację otwartą, aby widzieć przypomnienia. Brak gwarancji powiadomień w tle. Rozpoznawanie mowy nie jest połączone.', prepInMinutes: 'Za {n} minut: {title}',
  g2Today: 'DZIŚ', g2Important: 'WAŻNE', g2Done: 'GOTOWE', g2Earlier: 'WCZEŚNIEJ', g2FamilyNote: 'NOTATKA RODZINY', g2Microphone: 'MIKROFON', g2Listening: 'Nasłuchiwanie lokalne', g2Release: 'Puść, aby zatrzymać',
  g2AllDone: 'Wszystko gotowe. Dziękujemy.', g2TapDone: 'Dotknij = gotowe', g2NotDue: 'Jeszcze nie czas', g2TapNext: 'Dotknij = następny krok', g2DoubleTapToday: 'Dwukrotne dotknięcie = dziś', g2HelpRequested: 'Poproszono o pomoc',
  g2NotTodayConfirmed: 'Dzisiaj nie · niepotwierdzone', g2ALittleLater: 'Chwilę później', g2StillToDo: 'Jeszcze do zrobienia? Dotknij = gotowe', g2InMin: 'Za {n} min', g2AllSteps: 'Wszystkie kroki potwierdzone.',
};
const uk: Strings = {
  navToday: 'Сьогодні', navRoutines: 'Звички', navPeople: 'Знайомі люди', navCheckins: 'Відгуки', navHistory: 'Історія змін', navSettings: 'Налаштування',
  lovedOneView: 'Вигляд для рідної особи', signOut: 'Вийти', familyWorkspace: 'Простір родини', connectGlasses: 'Під’єднати окуляри G2',
  morningFallback: 'Трохи підтримки для {name}.', nothingPlanned: 'Нічого не заплановано. Не поспішайте.', quietNow: 'Звичайні нагадування зараз беззвучні.', breakActive: 'Триває запланована перерва. Повідомлення родині надходять.',
  statePending: 'Не підтверджено', stateDone: 'Підтверджено', statePostponed: 'Трохи пізніше', stateHelp: 'Потрібна допомога', stateDeclined: 'Сьогодні ні',
  actDone: 'Зроблено', actLater: 'Трохи пізніше', actHelp: 'Мені потрібна допомога', actNotToday: 'Сьогодні ні', actShowAgain: 'Показати ще раз', actWhatNext: 'Що далі?', actNextStep: 'Наступний крок',
  routineSection: 'Звічна звичка', familiarSection: 'Хтось знайомий', askSection: 'Запитайте', askPlaceholder: 'Хто така Анна?', callPerson: 'Зателефонувати: {name}', stepOf: '{step} із {total}', allStepsDone: 'Усі кроки підтверджено. Не поспішайте.',
  footerCompanion: 'Тримайте цей застосунок відкритим, щоб бачити нагадування. Гарантованих фонових сповіщень немає. Розпізнавання мови не під’єднано.', prepInMinutes: 'За {n} хв: {title}',
  g2Today: 'СЬОГОДНІ', g2Important: 'ВАЖЛИВО', g2Done: 'ЗРОБЛЕНО', g2Earlier: 'РАНІШЕ', g2FamilyNote: 'ЗАМІТКА РОДИНИ', g2Microphone: 'МІКРОФОН', g2Listening: 'Локальний запис', g2Release: 'Відпустіть, щоб зупинити',
  g2AllDone: 'Усе зроблено. Дякуємо.', g2TapDone: 'Дотик = зроблено', g2NotDue: 'Ще не час', g2TapNext: 'Дотик = наступний крок', g2DoubleTapToday: 'Подвійний дотик = сьогодні', g2HelpRequested: 'Потрібна допомога',
  g2NotTodayConfirmed: 'Сьогодні ні · не підтверджено', g2ALittleLater: 'Трохи пізніше', g2StillToDo: 'Ще треба? Дотик = зроблено', g2InMin: 'За {n} хв', g2AllSteps: 'Усі кроки підтверджено.',
};
const ru: Strings = {
  navToday: 'Сегодня', navRoutines: 'Привычки', navPeople: 'Знакомые люди', navCheckins: 'Отклики', navHistory: 'История изменений', navSettings: 'Настройки',
  lovedOneView: 'Вид для близкого человека', signOut: 'Выйти', familyWorkspace: 'Пространство семьи', connectGlasses: 'Подключить очки G2',
  morningFallback: 'Немного поддержки для {name}.', nothingPlanned: 'Ничего не запланировано. Не спешите.', quietNow: 'Обычные напоминания сейчас беззвучны.', breakActive: 'Идёт запланированный перерыв. Сообщения семье продолжают приходить.',
  statePending: 'Не подтверждено', stateDone: 'Подтверждено', statePostponed: 'Чуть позже', stateHelp: 'Запрошена помощь', stateDeclined: 'Сегодня нет',
  actDone: 'Готово', actLater: 'Чуть позже', actHelp: 'Мне нужна помощь', actNotToday: 'Сегодня нет', actShowAgain: 'Показать ещё раз', actWhatNext: 'Что дальше?', actNextStep: 'Следующий шаг',
  routineSection: 'Привычный порядок', familiarSection: 'Кто-то знакомый', askSection: 'Задайте вопрос', askPlaceholder: 'Кто такая Анна?', callPerson: 'Позвонить: {name}', stepOf: '{step} из {total}', allStepsDone: 'Все шаги подтверждены. Не спешите.',
  footerCompanion: 'Держите это приложение открытым, чтобы видеть напоминания. Гарантированных фоновых оповещений нет. Распознавание речи не подключено.', prepInMinutes: 'Через {n} мин: {title}',
  g2Today: 'СЕГОДНЯ', g2Important: 'ВАЖНО', g2Done: 'ГОТОВО', g2Earlier: 'РАНЬШЕ', g2FamilyNote: 'ЗАМЕТКА СЕМЬИ', g2Microphone: 'МИКРОФОН', g2Listening: 'Локальная запись', g2Release: 'Отпустите, чтобы остановить',
  g2AllDone: 'Всё готово. Спасибо.', g2TapDone: 'Нажмите = готово', g2NotDue: 'Ещё не время', g2TapNext: 'Нажмите = следующий шаг', g2DoubleTapToday: 'Двойное нажатие = сегодня', g2HelpRequested: 'Запрошена помощь',
  g2NotTodayConfirmed: 'Сегодня нет · не подтверждено', g2ALittleLater: 'Чуть позже', g2StillToDo: 'Ещё нужно? Нажмите = готово', g2InMin: 'Через {n} мин', g2AllSteps: 'Все шаги подтверждены.',
};
const tr: Strings = {
  navToday: 'Bugün', navRoutines: 'Rutinler', navPeople: 'Tanıdık kişiler', navCheckins: 'Haberleşmeler', navHistory: 'Değişiklik geçmişi', navSettings: 'Ayarlar',
  lovedOneView: 'Sevilen kişi görünümü', signOut: 'Çıkış yap', familyWorkspace: 'Aile alanı', connectGlasses: 'G2 gözlüğü bağla',
  morningFallback: '{name} için küçük bir destek.', nothingPlanned: 'Bir şey planlanmadı. Acele etmeyin.', quietNow: 'Sıradan hatırlatmalar şu anda sessiz.', breakActive: 'Planlanmış bir ara sürüyor. Aileye bildirimler devam ediyor.',
  statePending: 'Onaylanmadı', stateDone: 'Onaylandı', statePostponed: 'Biraz sonra', stateHelp: 'Yardım istendi', stateDeclined: 'Bugün hayır',
  actDone: 'Tamam', actLater: 'Biraz sonra', actHelp: 'Yardıma ihtiyacım var', actNotToday: 'Bugün hayır', actShowAgain: 'Yeniden göster', actWhatNext: 'Sırada ne var?', actNextStep: 'Sonraki adım',
  routineSection: 'Tanıdık bir rutin', familiarSection: 'Tanıdık biri', askSection: 'Bir soru sorun', askPlaceholder: 'Anna kim?', callPerson: '{name} kişisini ara', stepOf: '{total} adımdan {step}.', allStepsDone: 'Tüm adımlar onaylandı. Acele etmeyin.',
  footerCompanion: 'Hatırlatmaları görmek için bu eşliği açık tutun. Arka plan uyarıları garanti edilmez. Ses tanıma bağlı değil.', prepInMinutes: '{n} dakika içinde: {title}',
  g2Today: 'BUGÜN', g2Important: 'ÖNEMLİ', g2Done: 'TAMAM', g2Earlier: 'ÖNCE', g2FamilyNote: 'AILE NOTU', g2Microphone: 'MİKROFON', g2Listening: 'Yerel olarak dinleniyor', g2Release: 'Durdurmak için bırakın',
  g2AllDone: 'Hepsi tamam. Teşekkürler.', g2TapDone: 'Dokun = tamam', g2NotDue: 'Daha vakti değil', g2TapNext: 'Dokun = sonraki adım', g2DoubleTapToday: 'Çift dokunuş = bugün', g2HelpRequested: 'Yardım istendi',
  g2NotTodayConfirmed: 'Bugün hayır · onaylanmadı', g2ALittleLater: 'Biraz sonra', g2StillToDo: 'Hâlâ yapılacak? Dokun = tamam', g2InMin: '{n} dk içinde', g2AllSteps: 'Tüm adımlar onaylandı.',
};
const ar: Strings = {
  navToday: 'اليوم', navRoutines: 'روتينات', navPeople: 'أشخاص معروفون', navCheckins: 'متابعات', navHistory: 'سجل التغييرات', navSettings: 'الإعدادات',
  lovedOneView: 'عرض الشخص العزيز', signOut: 'تسجيل الخروج', familyWorkspace: 'مساحة العائلة', connectGlasses: 'ربط نظارة G2',
  morningFallback: 'قليل من الدعم لـ{name}.', nothingPlanned: 'لا يوجد شيء مقرر. خذ وقتك.', quietNow: 'التذكيرات العادية صامتة الآن.', breakActive: 'هناك استراحة مخطط لها. تستمر رسائل العائلة.',
  statePending: 'غير مؤكد', stateDone: 'مؤكد', statePostponed: 'بعد قليل', stateHelp: 'طلب مساعدة', stateDeclined: 'ليس اليوم',
  actDone: 'تم', actLater: 'بعد قليل', actHelp: 'أحتاج إلى مساعدة', actNotToday: 'ليس اليوم', actShowAgain: 'أظهر مرة أخرى', actWhatNext: 'ما التالي؟', actNextStep: 'الخطوة التالية',
  routineSection: 'روتين مألوف', familiarSection: 'شخص مألوف', askSection: 'اطرح سؤالاً', askPlaceholder: 'من هي آنا؟', callPerson: 'اتصل بـ{name}', stepOf: '{step} من {total}', allStepsDone: 'تم تأكيد جميع الخطوات. خذ وقتك.',
  footerCompanion: 'أبقِ هذا المصاحب مفتوحًا لرؤية التذكيرات. لا ضمان لإشعارات في الخلفية. التعرف على الصوت غير متصل.', prepInMinutes: 'خلال {n} دقيقة: {title}',
  g2Today: 'اليوم', g2Important: 'مهم', g2Done: 'تم', g2Earlier: 'سابقًا', g2FamilyNote: 'ملاحظة عائلية', g2Microphone: 'ميكروفون', g2Listening: 'استماع محلي', g2Release: 'حرّر للإيقاف',
  g2AllDone: 'كل شيء تم. شكرًا لك.', g2TapDone: 'انقر = تم', g2NotDue: 'لم يحن الوقت بعد', g2TapNext: 'انقر = الخطوة التالية', g2DoubleTapToday: 'نقر مزدوج = اليوم', g2HelpRequested: 'طلب مساعدة',
  g2NotTodayConfirmed: 'ليس اليوم · غير مؤكد', g2ALittleLater: 'بعد قليل', g2StillToDo: 'ما زال مطلوبًا؟ انقر = تم', g2InMin: 'خلال {n} دقيقة', g2AllSteps: 'تم تأكيد جميع الخطوات.',
};
const hi: Strings = {
  navToday: 'आज', navRoutines: 'दिनचर्या', navPeople: 'जाने-पहचाने लोग', navCheckins: 'जानकारी', navHistory: 'बदलावों का इतिहास', navSettings: 'सेटिंग्स',
  lovedOneView: 'प्रिय व्यक्ति का दृश्य', signOut: 'साइन आउट', familyWorkspace: 'परिवार का स्थान', connectGlasses: 'G2 चश्मा जोड़ें',
  morningFallback: '{name} के लिए थोड़ा सहारा।', nothingPlanned: 'कुछ भी निर्धारित नहीं। आराम से।', quietNow: 'सामान्य याद दहानियाँ अभी चुप हैं।', breakActive: 'एक नियोजित विराम चालू है। परिवार को सूचनाएँ चलती रहती हैं।',
  statePending: 'अपुष्ट', stateDone: 'पुष्ट', statePostponed: 'थोड़ा बाद में', stateHelp: 'मदद चाहिए', stateDeclined: 'आज नहीं',
  actDone: 'पूर्ण', actLater: 'थोड़ा बाद में', actHelp: 'मुझे मदद चाहिए', actNotToday: 'आज नहीं', actShowAgain: 'फिर से दिखाएँ', actWhatNext: 'आगे क्या?', actNextStep: 'अगला चरण',
  routineSection: 'एक परिचित दिनचर्या', familiarSection: 'कोई परिचित', askSection: 'प्रश्न पूछें', askPlaceholder: 'अन्ना कौन है?', callPerson: '{name} को कॉल करें', stepOf: '{total} में से {step}', allStepsDone: 'सभी चरण पुष्ट हो गए। आराम से।',
  footerCompanion: 'याद दहानियाँ देखने के लिए यह साथी खुला रखें। पृष्ठभूमि सूचनाओं की गारंटी नहीं। वाणी पहचान जुड़ी नहीं है।', prepInMinutes: '{n} मिनट में: {title}',
  g2Today: 'आज', g2Important: 'महत्वपूर्ण', g2Done: 'पूर्ण', g2Earlier: 'पहले', g2FamilyNote: 'परिवार नोट', g2Microphone: 'माइक्रोफ़ोन', g2Listening: 'स्थानीय सुनवाई', g2Release: 'रोकने के लिए छोड़ें',
  g2AllDone: 'सब पूरा। धन्यवाद।', g2TapDone: 'टैप = पूर्ण', g2NotDue: 'अभी समय नहीं', g2TapNext: 'टैप = अगला चरण', g2DoubleTapToday: 'डबल टैप = आज', g2HelpRequested: 'मदद चाहिए',
  g2NotTodayConfirmed: 'आज नहीं · अपुष्ट', g2ALittleLater: 'थोड़ा बाद में', g2StillToDo: 'बाकी है? टैप = पूर्ण', g2InMin: '{n} मिनट में', g2AllSteps: 'सभी चरण पुष्ट हो गए।',
};
const zh: Strings = {
  navToday: '今天', navRoutines: '日常流程', navPeople: '熟悉的人', navCheckins: '跟进记录', navHistory: '改动记录', navSettings: '设置',
  lovedOneView: '亲友视图', signOut: '退出登录', familyWorkspace: '家人空间', connectGlasses: '连接 G2 眼镜',
  morningFallback: '为{name}提供一点支持。', nothingPlanned: '今天没有安排。慢慢来。', quietNow: '普通提醒现在是静音的。', breakActive: '计划中的休息正在进行。给家人的通知仍会发送。',
  statePending: '未确认', stateDone: '已确认', statePostponed: '稍后再说', stateHelp: '请求帮助', stateDeclined: '今天不做',
  actDone: '完成', actLater: '稍后再说', actHelp: '我需要帮助', actNotToday: '今天不做', actShowAgain: '再看一次', actWhatNext: '接下来是什么？', actNextStep: '下一步',
  routineSection: '熟悉的流程', familiarSection: '熟悉的人', askSection: '提问', askPlaceholder: '安娜是谁？', callPerson: '拨打 {name}', stepOf: '第 {step} / {total} 步', allStepsDone: '所有步骤已确认。慢慢来。',
  footerCompanion: '请保持此陪伴页面打开以查看提醒。不保证后台提醒。语音识别未连接。', prepInMinutes: '{n} 分钟后：{title}',
  g2Today: '今天', g2Important: '重要', g2Done: '完成', g2Earlier: '更早', g2FamilyNote: '家人备注', g2Microphone: '麦克风', g2Listening: '本地聆听中', g2Release: '松开以停止',
  g2AllDone: '都完成了。谢谢。', g2TapDone: '轻点 = 完成', g2NotDue: '还没到时间', g2TapNext: '轻点 = 下一步', g2DoubleTapToday: '双击 = 今天', g2HelpRequested: '请求帮助',
  g2NotTodayConfirmed: '今天不做 · 未确认', g2ALittleLater: '稍后再说', g2StillToDo: '还没做？轻点 = 完成', g2InMin: '{n} 分钟后', g2AllSteps: '所有步骤已确认。',
};
const ja: Strings = {
  navToday: '今日', navRoutines: '日課', navPeople: '顔なじみの方', navCheckins: '確認記録', navHistory: '変更履歴', navSettings: '設定',
  lovedOneView: '大切な方の表示', signOut: 'ログアウト', familyWorkspace: '家族のスペース', connectGlasses: 'G2メガネを接続',
  morningFallback: '{name}さんへのちょっとした支え。', nothingPlanned: '予定はありません。ゆっくりで大丈夫です。', quietNow: '通常のリマインダーは現在静かです。', breakActive: '計画中の休息中です。家族への通知は続きます。',
  statePending: '未確認', stateDone: '確認済み', statePostponed: 'もう少し後で', stateHelp: '助けを求めました', stateDeclined: '今日はしません',
  actDone: '完了', actLater: 'もう少し後で', actHelp: '助けがほしい', actNotToday: '今日はしません', actShowAgain: 'もう一度表示', actWhatNext: '次は？', actNextStep: '次のステップ',
  routineSection: '慣れた日課', familiarSection: '顔なじみの方', askSection: '質問する', askPlaceholder: 'アンナは誰？', callPerson: '{name}さんに電話', stepOf: '{total}中{step}', allStepsDone: 'すべてのステップを確認しました。ゆっくりで大丈夫です。',
  footerCompanion: 'お知らせを見るにはこの画面を開いたままにしてください。背景通知は保証されません。音声認識は接続されていません。', prepInMinutes: '{n}分後：{title}',
  g2Today: '今日', g2Important: '重要', g2Done: '完了', g2Earlier: '以前', g2FamilyNote: '家族のメモ', g2Microphone: 'マイク', g2Listening: 'この端末で聞き取り中', g2Release: '離すと停止',
  g2AllDone: 'すべて完了。ありがとう。', g2TapDone: 'タップ = 完了', g2NotDue: 'まだ時間前です', g2TapNext: 'タップ = 次のステップ', g2DoubleTapToday: 'ダブルタップ = 今日', g2HelpRequested: '助けを求めました',
  g2NotTodayConfirmed: '今日はしません · 未確認', g2ALittleLater: 'もう少し後で', g2StillToDo: 'まだですか？タップ = 完了', g2InMin: '{n}分後', g2AllSteps: 'すべてのステップを確認しました。',
};
const ko: Strings = {
  navToday: '오늘', navRoutines: '일과', navPeople: '익숙한 사람', navCheckins: '확인 기록', navHistory: '변경 이력', navSettings: '설정',
  lovedOneView: '소중한 분 보기', signOut: '로그아웃', familyWorkspace: '가족 공간', connectGlasses: 'G2 안경 연결',
  morningFallback: '{name}님을 위한 작은 도움.', nothingPlanned: '예정된 일이 없어요. 천천히 하세요.', quietNow: '일반 알림은 지금 조용합니다.', breakActive: '계획된 휴식 중입니다. 가족에게 보내는 알림은 계속됩니다.',
  statePending: '확인되지 않음', stateDone: '확인됨', statePostponed: '조금 후에', stateHelp: '도움 요청', stateDeclined: '오늘은 하지 않음',
  actDone: '완료', actLater: '조금 후에', actHelp: '도움이 필요해요', actNotToday: '오늘은 하지 않음', actShowAgain: '다시 보기', actWhatNext: '다음은?', actNextStep: '다음 단계',
  routineSection: '익숙한 일과', familiarSection: '익숙한 사람', askSection: '질문하기', askPlaceholder: '애나는 누구?', callPerson: '{name}님에게 전화', stepOf: '{total}개 중 {step}', allStepsDone: '모든 단계를 확인했어요. 천천히 하세요.',
  footerCompanion: '알림을 보려면 이 화면을 열어 두세요. 백그라운드 알림은 보장되지 않아요. 음성 인식은 연결되지 않았어요.', prepInMinutes: '{n}분 후: {title}',
  g2Today: '오늘', g2Important: '중요', g2Done: '완료', g2Earlier: '이전에', g2FamilyNote: '가족 메모', g2Microphone: '마이크', g2Listening: '이 기기에서 듣는 중', g2Release: '놓으면 중지',
  g2AllDone: '모두 끝났어요. 고마워요.', g2TapDone: '탭 = 완료', g2NotDue: '아직 시간 전이에요', g2TapNext: '탭 = 다음 단계', g2DoubleTapToday: '더블 탭 = 오늘', g2HelpRequested: '도움 요청',
  g2NotTodayConfirmed: '오늘은 하지 않음 · 확인되지 않음', g2ALittleLater: '조금 후에', g2StillToDo: '남았나요? 탭 = 완료', g2InMin: '{n}분 후', g2AllSteps: '모든 단계를 확인했어요.',
};

export const DICTIONARIES: Record<Language, Strings> = { en, de, es, fr, it, pt, nl, pl, uk, ru, tr, ar, hi, zh, ja, ko };

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}
/** Unknown or missing settings always fall back to English rather than showing raw keys. */
export function stringsFor(language: unknown): Strings {
  return isLanguage(language) ? DICTIONARIES[language] : DICTIONARIES.en;
}
export function textDirection(language: unknown): 'ltr' | 'rtl' {
  return isLanguage(language) && RIGHT_TO_LEFT.includes(language) ? 'rtl' : 'ltr';
}
/** Fills {name}-style placeholders without trusting the wording itself. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole));
}
