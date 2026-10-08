import type { Locale } from './i18n.js';

export type Dict = { [key: string]: string | Dict };

export const uiStrings: Dict = {
    places: {
        myPlaces: 'My Places',
        placesToVisit: 'Places to Visit',
        toggleList: 'Toggle places list',
        visitDate: 'Visit Date: {date}',
        viewAllOne: 'View All {count} Photo',
        viewAllMany: 'View All {count} Photos',
        showAll: 'Show all photos',
        photoAlt: '{name} photo',
        photoAltN: '{name} photo {n}',
        typeHistoric: 'Historic Site',
        typeVacation: 'Vacation',
        typeWork: 'Work',
        typeNature: 'Nature',
        typePlace: 'Place',
    },
    modal: {
        close: 'Close',
        fullscreen: 'Fullscreen',
        loadingImage: 'Loading full-size image...',
        loadingError: 'Error loading image',
        loading360: 'Loading 360° view...',
        loading360Error: 'Error loading 360° viewer',
        dragHint: 'Drag to look around • Scroll to zoom',
        prev: 'Previous photo',
        next: 'Next photo',
        view360: '{name} - 360° View',
        gallery: '{name} - Photo Gallery',
    },
    app: {
        webglMissing: 'The interactive 3D Earth needs WebGL, which is not available in this browser.',
    },
    eggs: {
        astronaut: 'Astronaut speed boost!',
        stars: 'Shooting star shower!',
        oceansGone: 'The oceans are gone.',
        oceansReturn: 'The oceans return.',
        timeWarp: 'Time warp!',
        colorMode: 'Color mode: {mode}',
        fireworks: 'Fireworks!',
        helpTitle: 'Easter Egg Controls',
        helpAstronaut: 'Astronaut speed boost',
        helpStars: 'Shooting star shower',
        helpTime: 'Time warp',
        helpColor: 'Change color mode',
        helpFireworks: 'Fireworks show',
        helpHelp: 'Show this help',
        morphTitle: 'Earth morph style',
        morphCubeZoom: 'Cube unfold + zoom (default)',
        morphCubeFade: 'Cube unfold + fade',
        morphClassic: 'Classic peel',
        clickSurprises: 'Click anywhere for surprises!',
    },
};

const en: Dict = {
    portfolio: {
        lang: 'Language',
        toc: 'Contents',
        aboutNav: 'About Me',
        skillsNav: 'Skills',
        experienceNav: 'Experience',
        educationNav: 'Education',
        interestsNav: 'Interests',
        close: 'Close portfolio',
        subtitle: 'Full Stack Developer · WebGL, Geospatial & Research Data · Based in Germany',
        aboutTitle: 'About Me',
        aboutP1:
            'I build interactive web applications where data, maps and 3D come together: WebGL viewers, geospatial interfaces and the maintainable backends behind them.',
        aboutP2:
            'Before moving into software engineering, I spent years as an archaeologist on excavations across West Asia and Europe, where I designed the research databases and digital tools those projects relied on. That background still shapes how I work: careful with sensitive data, at home in complex, intercultural teams, and curious about the structures hidden beneath the surface.',
        skillsTitle: 'Skills',
        skillFrontend: 'Frontend & 3D',
        skillGeo: 'Geospatial',
        skillBackend: 'Backend & Data',
        skillOps: 'Process & Operations',
        experienceTitle: 'Experience',
        job1Title: 'System Engineer',
        job1Company: 'ESCRIBA AG · Apr 2021 – Present · Berlin / Wuppertal (Remote), Germany',
        job1Body: `<ul>
<li>Architect, develop, and maintain custom enterprise applications across the full lifecycle—from requirements analysis and technical design through deployment and production support</li>
<li>Develop backend logic in Java and frontend features in JavaScript/TypeScript, extensively customizing and extending the AgileApps/ECAP low-code platform</li>
<li>Analyse and integrate complex third-party APIs (REST, JSON, XML) and SAP system interfaces</li>
<li>Model and automate complex business workflows with UML &amp; BPMN 2.0, translating stakeholder requirements into maintainable technical solutions</li>
<li>Configure Apache Tomcat servers and troubleshoot issues across frontend, backend, SQL databases, and server infrastructure</li>
</ul>`,
        job2Title: 'Graduate Student Assistant (Web Developer & Repository Architect)',
        job2Company: 'Topoi Excellence Cluster · Dec 2016 – Dec 2018 · Berlin, Germany',
        job2Body: `<ul>
<li>Designed, developed, and maintained a research data repository for archaeological and spatial datasets using Python, Django, JavaScript, CSS, and Shell scripting</li>
<li>Built interfaces for searching, filtering, navigating, and managing heterogeneous research data, focusing on database integrity and long-term preservation</li>
<li>Supported digital humanities initiatives by translating specialized academic requirements into custom technical workflows</li>
</ul>`,
        job3Title: 'Graduate Student Assistant (Surveyor & Data Specialist)',
        job3Company:
            'University of Tübingen / Freie Universität Berlin / German Archaeological Institute · 2012 – 2019 · West Asia & Europe',
        job3Body: `Worked on international archaeological projects in Iraqi Kurdistan, Iran, Jordan, and Saudi Arabia, and on contemporary archaeology excavations in Germany.
<ul>
<li>Conducted systematic field surveys, GIS-based mapping, and spatial data collection in challenging environments (including the Eastern Ḫabur Archaeological Survey in Duhok, Iraqi Kurdistan, and the Jiroft Survey in Kerman, Iran)</li>
<li>Excavated and documented sites of the National Socialist era in Berlin (forced-labour camps at Tempelhofer Feld and investigations at the former Kaiser Wilhelm Institute for Anthropology, Human Heredity, and Eugenics), applying strict standards for historically and ethically sensitive data</li>
<li>Designed and managed research databases and built custom tools (Python, Django, JavaScript, QGIS/ArcGIS) for spatial data processing and visualisation</li>
<li>Combined cultural heritage expertise with technical development to support interdisciplinary, international research teams</li>
</ul>`,
        educationTitle: 'Education',
        edu1Title: "History and Cultures of Ancient Western Asia (Master's Programme)",
        edu1Company:
            'Freie Universität Berlin · 2017 – 2021 · Coursework completed; moved into software engineering in 2021',
        edu1Body: `<ul>
<li><strong>Spatial &amp; computational methods:</strong> remote sensing and digital image processing, quantitative landscape modelling with R, GIS cartography and terrain analysis, AutoCAD</li>
<li><strong>Social and political archaeology:</strong> inequality in early complex societies, imperialism and ideology</li>
</ul>`,
        edu2Title: 'Studies in Ancient Civilisations (Bachelor of Arts)',
        edu2Company:
            'Freie Universität Berlin · 2015 · Concentration: Ancient Near Eastern Archaeology',
        edu2Body: `Foundational studies in Ancient Western Asian archaeology, material culture, and field methods.
<p class="experience-note">
<strong>Bachelor thesis ("Open Access und Open Data in der Archäologie"):</strong>
Explored Semantic Web technologies (Linked Open Data, JSON-LD, RDF, XML) for archaeological research and developed a conceptual WebGIS for the excavations of National Socialist forced-labour camps at Tempelhofer Feld. The work was cited in Reinhard Bernbeck's <em>"Materielle Spuren des nationalsozialistischen Terrors: Zu einer Archäologie der Zeitgeschichte"</em>.
</p>`,
        interestsTitle: 'Interests & Side Projects',
        interestsP1:
            'Outside of work I build experimental 3D visualisations, explore geospatial data, contribute to open source, and keep learning new interactive web technologies. When away from the terminal, I enjoy indie game development (Godot, pixel art), linocut printmaking, and playing blues and jazz guitar.',
        interestsP2: `<strong>Personal research &amp; reading:</strong> theories of power, post-colonial thought, and the history, languages (Kurmanji, Sorani, Persian), culture, and geopolitics of Kurdistan and West Asia.`,
    },
};

const de: Dict = {
    portfolio: {
        lang: 'Sprache',
        toc: 'Inhalt',
        aboutNav: 'Über mich',
        skillsNav: 'Skills',
        experienceNav: 'Erfahrung',
        educationNav: 'Ausbildung',
        interestsNav: 'Interessen',
        close: 'Portfolio schließen',
        subtitle: 'Full-Stack-Entwickler · WebGL, Geospatial & Forschungsdaten · Deutschland',
        aboutTitle: 'Über mich',
        aboutP1:
            'Ich baue interaktive Webanwendungen, in denen Daten, Karten und 3D zusammenkommen: WebGL-Viewer, geospatiale Oberflächen und die wartbaren Backends dahinter.',
        aboutP2:
            'Bevor ich in die Softwareentwicklung gewechselt bin, war ich jahrelang als Archäologe auf Ausgrabungen in Westasien und Europa tätig und habe dort die Forschungsdatenbanken und digitalen Werkzeuge entworfen, auf die diese Projekte angewiesen waren. Dieser Hintergrund prägt meine Arbeit bis heute: sorgfältig mit sensiblen Daten, vertraut mit komplexen, interkulturellen Teams und neugierig auf die Strukturen unter der Oberfläche.',
        skillsTitle: 'Skills',
        skillFrontend: 'Frontend & 3D',
        skillGeo: 'Geospatial',
        skillBackend: 'Backend & Daten',
        skillOps: 'Prozesse & Betrieb',
        experienceTitle: 'Erfahrung',
        job1Title: 'System Engineer',
        job1Company: 'ESCRIBA AG · Apr 2021 – heute · Berlin / Wuppertal (Remote), Deutschland',
        job1Body: `<ul>
<li>Konzeption, Entwicklung und Wartung individueller Enterprise-Anwendungen über den gesamten Lebenszyklus – von Anforderungsanalyse und technischem Design bis Deployment und Produktivbetrieb</li>
<li>Backend-Logik in Java und Frontend-Features in JavaScript/TypeScript, mit umfangreicher Anpassung und Erweiterung der Low-Code-Plattform AgileApps/ECAP</li>
<li>Analyse und Integration komplexer Drittanbieter-APIs (REST, JSON, XML) sowie SAP-Schnittstellen</li>
<li>Modellierung und Automatisierung komplexer Geschäftsprozesse mit UML &amp; BPMN 2.0 und Umsetzung von Stakeholder-Anforderungen in wartbare technische Lösungen</li>
<li>Konfiguration von Apache-Tomcat-Servern und Fehlersuche über Frontend, Backend, SQL-Datenbanken und Serverinfrastruktur</li>
</ul>`,
        job2Title: 'Wissenschaftliche Hilfskraft (Webentwickler & Repository-Architekt)',
        job2Company: 'Exzellenzcluster Topoi · Dez 2016 – Dez 2018 · Berlin, Deutschland',
        job2Body: `<ul>
<li>Konzeption, Entwicklung und Wartung eines Forschungsdaten-Repositorys für archäologische und räumliche Datensätze mit Python, Django, JavaScript, CSS und Shell-Skripten</li>
<li>Oberflächen für Suche, Filter, Navigation und Verwaltung heterogener Forschungsdaten mit Fokus auf Datenintegrität und langfristige Erhaltung</li>
<li>Unterstützung digitaler Geisteswissenschaften durch die Übersetzung spezialisierter wissenschaftlicher Anforderungen in eigene technische Workflows</li>
</ul>`,
        job3Title: 'Wissenschaftliche Hilfskraft (Vermessung & Datenspezialist)',
        job3Company:
            'Universität Tübingen / Freie Universität Berlin / Deutsches Archäologisches Institut · 2012 – 2019 · Westasien & Europa',
        job3Body: `Mitarbeit an internationalen archäologischen Projekten im Irakischen Kurdistan, im Iran, in Jordanien und Saudi-Arabien sowie an Ausgrabungen der Archäologie der Zeitgeschichte in Deutschland.
<ul>
<li>Systematische Feldbegehungen, GIS-basierte Kartierung und räumliche Datenerfassung unter schwierigen Bedingungen (u. a. Eastern Ḫabur Archaeological Survey in Duhok, Irakisches Kurdistan, und Jiroft Survey in Kerman, Iran)</li>
<li>Ausgrabung und Dokumentation von Orten der NS-Zeit in Berlin (Zwangsarbeiterlager auf dem Tempelhofer Feld und Untersuchungen am ehemaligen Kaiser-Wilhelm-Institut für Anthropologie, menschliche Erblehre und Eugenik) unter strengen Standards für historisch und ethisch sensible Daten</li>
<li>Aufbau und Pflege von Forschungsdatenbanken sowie eigene Werkzeuge (Python, Django, JavaScript, QGIS/ArcGIS) für räumliche Datenverarbeitung und Visualisierung</li>
<li>Verbindung von Kulturerbe-Expertise und technischer Entwicklung zur Unterstützung interdisziplinärer, internationaler Forschungsteams</li>
</ul>`,
        educationTitle: 'Ausbildung',
        edu1Title: 'Geschichte und Kulturen Altvorderasiens (Masterstudiengang)',
        edu1Company:
            'Freie Universität Berlin · 2017 – 2021 · Studienleistungen abgeschlossen; 2021 Wechsel in die Softwareentwicklung',
        edu1Body: `<ul>
<li><strong>Räumliche &amp; computergestützte Methoden:</strong> Fernerkundung und digitale Bildverarbeitung, quantitative Landschaftsmodellierung mit R, GIS-Kartographie und Geländeanalyse, AutoCAD</li>
<li><strong>Soziale und politische Archäologie:</strong> Ungleichheit in frühen komplexen Gesellschaften, Imperialismus und Ideologie</li>
</ul>`,
        edu2Title: 'Altertumswissenschaften (Bachelor of Arts)',
        edu2Company:
            'Freie Universität Berlin · 2015 · Schwerpunkt: Vorderasiatische Archäologie',
        edu2Body: `Grundlagenstudium der Archäologie des Alten Vorderasiens, der materiellen Kultur und der Feldmethoden.
<p class="experience-note">
<strong>Bachelorarbeit („Open Access und Open Data in der Archäologie“):</strong>
Untersuchung von Semantic-Web-Technologien (Linked Open Data, JSON-LD, RDF, XML) für die archäologische Forschung und Entwicklung eines konzeptionellen WebGIS für die Ausgrabungen der nationalsozialistischen Zwangsarbeiterlager auf dem Tempelhofer Feld. Die Arbeit wurde in Reinhard Bernbecks <em>„Materielle Spuren des nationalsozialistischen Terrors: Zu einer Archäologie der Zeitgeschichte“</em> zitiert.
</p>`,
        interestsTitle: 'Interessen & Nebenprojekte',
        interestsP1:
            'Neben der Arbeit baue ich experimentelle 3D-Visualisierungen, erkunde Geodaten, trage zu Open Source bei und lerne weiter neue interaktive Webtechnologien. Abseits des Terminals: Indie-Game-Entwicklung (Godot, Pixel Art), Linolschnitt und Blues- sowie Jazzgitarre.',
        interestsP2: `<strong>Persönliche Forschung &amp; Lektüre:</strong> Theorien der Macht, postkoloniales Denken sowie Geschichte, Sprachen (Kurmandschi, Sorani, Persisch), Kultur und Geopolitik Kurdistans und Westasiens.`,
    },
};

export const portfolioStrings: Record<Locale, Dict> = { en, de };
