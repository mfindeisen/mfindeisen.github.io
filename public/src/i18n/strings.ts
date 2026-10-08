import type { Locale } from './i18n.js';

type Dict = { [key: string]: string | Dict };

const en: Dict = {
    meta: {
        title: 'Matthias Findeisen - Full Stack Developer & Creative Technologist',
        description:
            'Portfolio of Matthias Findeisen, a full stack developer and former archaeologist building WebGL, 3D and geospatial web applications, including an open-source RTI toolset for cultural heritage.',
    },
    loader: {
        text: 'Loading Earth ',
    },
    hero: {
        role: 'Full stack developer building 3D, map and research data applications for the web',
        tagline: 'WebGL · Geospatial · Cultural Heritage · Based in Germany',
    },
    nav: {
        quick: 'Quick navigation',
        showcase: 'Showcase →',
        portfolio: 'Portfolio →',
        back: '↑ Back to Beginning',
        backAria: 'Back to beginning',
        lang: 'Language',
    },
    scroll: {
        explore: 'Scroll to explore',
        exploreAria: 'Scroll to explore',
        unwrapping: 'Unwrapping Earth...',
    },
    portfolio: {
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
    showcase: {
        close: 'Close showcase',
        title: 'Showcase',
        overviewNav: 'RTI Toolset',
        moreNav: 'More Projects',
        portfolioNav: 'This Portfolio',
        overviewTitle: 'Reflectance Transformation Imaging (RTI) Toolset',
        overviewBody:
            'An open-source toolset for Reflectance Transformation Imaging, a technique used in cultural heritage to capture and reveal fine surface detail. It covers the full pipeline, from preparing raw captures to rendering them interactively in the browser. The four tools below make up the toolset; further projects follow after them.',
        modernRtiBody:
            'A modern, WebGL-based viewer for RTI data. Renders image-pyramid folders, tiled pyramidal TIFFs (Cloud Optimized GeoTIFF / COG) and Neural RTI decoders directly in the browser, with pan/zoom, interactive lighting and annotations.',
        rtiDbCompany: 'Database & Web Interface',
        rtiDbBody:
            'A database management system and web interface for cataloguing, uploading and managing RTI records and assets, with an embedded modernRtiViewer, role-based access and scholarly annotations.',
        rtiprepCompany: 'Command-line Utility · Go',
        rtiprepBody:
            'A fast command-line utility for converting PTM, HSH and standard images into hierarchical image-pyramid folders or tiled pyramidal TIFFs (COG) for web visualisation.',
        neuralCompany: 'Experimental ML Pipeline · PyTorch',
        neuralBody:
            'An experimental PyTorch pipeline to train and evaluate Neural RTI models, compressing spatial reflectance data into 4-channel latent maps and lightweight MLP decoders.',
        moreTitle: 'More Projects',
        moreBody:
            'Independent projects outside the RTI toolset: offline-first field data collection, a cross-platform map app, and the site you are looking at.',
        humanityCompany: 'Offline-First Field Data Platform · Vue 3 · Node.js · CouchDB',
        humanityBody:
            'An open-source, offline-first low-code data collection platform designed for humanitarian field operations in infrastructure-challenged environments. Features bidirectional CouchDB/PouchDB synchronization, conflict resolution, client-side encryption for sensitive field data, and multilingual LTR/RTL interfaces.',
        kurdiCompany: 'Cross-Platform Geospatial & Events App · Kotlin Multiplatform · OpenStreetMap',
        kurdiBody:
            'A Kotlin Multiplatform app for discovering and mapping Kurdish cultural events across Android, iOS and Desktop. Features interactive OpenStreetMap cartography with dark map styles, GPS/location filtering, Material 3 UI, and a Ktor backend with SQLite and an admin CMS.',
        portfolioTitle: 'This Portfolio',
        portfolioCardTitle: 'Interactive Earth Portfolio',
        portfolioCardBody:
            'The site you are looking at: a scroll-driven morph from a 3D globe into a flat plane, handed off seamlessly to a vector map that flies to Erbil, with places, photo galleries and 360° panoramas.',
        liveDemo: 'Live Demo ↗︎',
        github: 'GitHub ↗︎',
        videoAria: 'Orbiting light source revealing surface detail in modernRtiViewer',
        rtidbAlt: 'rtiDb gallery listing RTI records',
        portfolioAlt: 'Start screen of the portfolio with the rotating 3D Earth',
    },
    footer: {
        secrets: "PRESS 'H' FOR SECRETS",
    },
    legal: {
        back: '← Back to portfolio',
    },
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

const de: Dict = {
    meta: {
        title: 'Matthias Findeisen - Full-Stack-Entwickler & Creative Technologist',
        description:
            'Portfolio von Matthias Findeisen, Full-Stack-Entwickler und ehemaliger Archäologe: WebGL-, 3D- und Geodaten-Anwendungen sowie ein Open-Source-RTI-Toolset für das Kulturerbe.',
    },
    loader: {
        text: 'Erde wird geladen ',
    },
    hero: {
        role: 'Full-Stack-Entwickler für 3D-, Karten- und Forschungsdaten-Anwendungen im Web',
        tagline: 'WebGL · Geospatial · Kulturerbe · Deutschland',
    },
    nav: {
        quick: 'Schnellnavigation',
        showcase: 'Showcase →',
        portfolio: 'Portfolio →',
        back: '↑ Zum Anfang',
        backAria: 'Zum Anfang zurück',
        lang: 'Sprache',
    },
    scroll: {
        explore: 'Scrollen zum Erkunden',
        exploreAria: 'Scrollen zum Erkunden',
        unwrapping: 'Erde wird entfaltet...',
    },
    portfolio: {
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
    showcase: {
        close: 'Showcase schließen',
        title: 'Showcase',
        overviewNav: 'RTI-Toolset',
        moreNav: 'Weitere Projekte',
        portfolioNav: 'Dieses Portfolio',
        overviewTitle: 'Reflectance Transformation Imaging (RTI) Toolset',
        overviewBody:
            'Ein Open-Source-Toolset für Reflectance Transformation Imaging – eine Technik im Kulturerbe, um feinste Oberflächenstrukturen zu erfassen und sichtbar zu machen. Es deckt die gesamte Pipeline ab: von der Aufbereitung Rohdaten bis zur interaktiven Darstellung im Browser. Die vier Werkzeuge unten bilden das Toolset; weitere Projekte folgen danach.',
        modernRtiBody:
            'Ein moderner WebGL-Viewer für RTI-Daten. Stellt Bildpyramiden-Ordner, gekachelte pyramidale TIFFs (Cloud Optimized GeoTIFF / COG) und Neural-RTI-Decoder direkt im Browser dar – mit Pan/Zoom, interaktiver Beleuchtung und Annotationen.',
        rtiDbCompany: 'Datenbank & Weboberfläche',
        rtiDbBody:
            'Ein Datenbankmanagementsystem mit Weboberfläche zum Katalogisieren, Hochladen und Verwalten von RTI-Datensätzen und Assets, mit eingebettetem modernRtiViewer, rollenbasierter Zugriffskontrolle und wissenschaftlichen Annotationen.',
        rtiprepCompany: 'Kommandozeilen-Werkzeug · Go',
        rtiprepBody:
            'Ein schnelles CLI-Werkzeug zur Konvertierung von PTM-, HSH- und Standardbildern in hierarchische Bildpyramiden-Ordner oder gekachelte pyramidale TIFFs (COG) für die Webvisualisierung.',
        neuralCompany: 'Experimentelle ML-Pipeline · PyTorch',
        neuralBody:
            'Eine experimentelle PyTorch-Pipeline zum Trainieren und Evaluieren von Neural-RTI-Modellen: räumliche Reflexionsdaten werden in 4-Kanal-Latent-Maps und leichte MLP-Decoder komprimiert.',
        moreTitle: 'Weitere Projekte',
        moreBody:
            'Eigenständige Projekte außerhalb des RTI-Toolsets: Offline-First-Felddatenerfassung, eine plattformübergreifende Karten-App und die Seite, die du gerade siehst.',
        humanityCompany: 'Offline-First-Felddatenplattform · Vue 3 · Node.js · CouchDB',
        humanityBody:
            'Eine Open-Source-, Offline-First-Low-Code-Plattform zur Datenerfassung für humanitäre Feldeinsätze in infrastrukturschwachen Umgebungen. Mit bidirektionaler CouchDB/PouchDB-Synchronisation, Konfliktlösung, clientseitiger Verschlüsselung sensibler Felddaten und mehrsprachigen LTR/RTL-Oberflächen.',
        kurdiCompany: 'Plattformübergreifende Geo- & Event-App · Kotlin Multiplatform · OpenStreetMap',
        kurdiBody:
            'Eine Kotlin-Multiplatform-App zum Entdecken und Kartieren kurdischer Kulturveranstaltungen auf Android, iOS und Desktop. Mit interaktiver OpenStreetMap-Kartographie inkl. dunkler Kartenstile, GPS-/Standortfiltern, Material-3-UI sowie einem Ktor-Backend mit SQLite und Admin-CMS.',
        portfolioTitle: 'Dieses Portfolio',
        portfolioCardTitle: 'Interaktives Erde-Portfolio',
        portfolioCardBody:
            'Die Seite, die du gerade siehst: ein scrollgesteuerter Morph von einem 3D-Globus in eine flache Ebene, nahtlos übergeben an eine Vektorkarte mit Flug nach Erbil – inklusive Orte, Fotogalerien und 360°-Panoramen.',
        liveDemo: 'Live-Demo ↗︎',
        github: 'GitHub ↗︎',
        videoAria: 'Orbitierende Lichtquelle zeigt Oberflächendetails in modernRtiViewer',
        rtidbAlt: 'rtiDb-Galerie mit RTI-Einträgen',
        portfolioAlt: 'Startbildschirm des Portfolios mit rotierender 3D-Erde',
    },
    footer: {
        secrets: "DRÜCKE 'H' FÜR GEHEIMNISSE",
    },
    legal: {
        back: '← Zurück zum Portfolio',
    },
    places: {
        myPlaces: 'Meine Orte',
        placesToVisit: 'Orte zum Besuchen',
        toggleList: 'Ortliste ein-/ausblenden',
        visitDate: 'Besuchszeitraum: {date}',
        viewAllOne: 'Alle {count} Foto anzeigen',
        viewAllMany: 'Alle {count} Fotos anzeigen',
        showAll: 'Alle Fotos anzeigen',
        photoAlt: 'Foto von {name}',
        photoAltN: 'Foto {n} von {name}',
        typeHistoric: 'Historische Stätte',
        typeVacation: 'Reise',
        typeWork: 'Arbeit',
        typeNature: 'Natur',
        typePlace: 'Ort',
    },
    modal: {
        close: 'Schließen',
        fullscreen: 'Vollbild',
        loadingImage: 'Vollbild wird geladen...',
        loadingError: 'Fehler beim Laden des Bildes',
        loading360: '360°-Ansicht wird geladen...',
        loading360Error: 'Fehler beim Laden des 360°-Viewers',
        dragHint: 'Ziehen zum Umschauen • Scrollen zum Zoomen',
        prev: 'Vorheriges Foto',
        next: 'Nächstes Foto',
        view360: '{name} - 360°-Ansicht',
        gallery: '{name} - Fotogalerie',
    },
    app: {
        webglMissing:
            'Die interaktive 3D-Erde benötigt WebGL, das in diesem Browser nicht verfügbar ist.',
    },
    eggs: {
        astronaut: 'Astronauten-Tempo!',
        stars: 'Sternschnuppen-Regen!',
        oceansGone: 'Die Ozeane sind verschwunden.',
        oceansReturn: 'Die Ozeane kehren zurück.',
        timeWarp: 'Zeitverzerrung!',
        colorMode: 'Farbmodus: {mode}',
        fireworks: 'Feuerwerk!',
        helpTitle: 'Easter-Egg-Steuerung',
        helpAstronaut: 'Astronauten-Tempo',
        helpStars: 'Sternschnuppen-Regen',
        helpTime: 'Zeitverzerrung',
        helpColor: 'Farbmodus wechseln',
        helpFireworks: 'Feuerwerk',
        helpHelp: 'Diese Hilfe anzeigen',
        morphTitle: 'Erde-Morph-Stil',
        morphCubeZoom: 'Würfel entfalten + Zoom (Standard)',
        morphCubeFade: 'Würfel entfalten + Fade',
        morphClassic: 'Klassisches Abschälen',
        clickSurprises: 'Irgendwo klicken für Überraschungen!',
    },
};

export const dictionaries: Record<Locale, Dict> = { en, de };
