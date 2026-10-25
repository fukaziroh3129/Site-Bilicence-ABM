// Textes de la plaquette de la bi-licence et de la fiche de l'UM, repris tels quels (typographie corrigée),
// avec les documents et contacts officiels. Les chiffres (matières, Parcoursup) restent dans `formation.ts`.
// Sources : plaquette V.056 (décembre 2025) ; fiche du catalogue de l'UM (mise à jour du 19 février 2026) ;
// pour la présentation, les options et le stage : le document Word convenu avec le service des plaquettes
// (24 octobre 2026), qui prime sur les deux autres.
// À relire chaque année : les services de l'université republient la plaquette à chaque rentrée.

import { SOURCES } from "@/lib/formation";

const NBSP = " ";

/** Documents et pages officiels, présentés à la fin de la page (liens vers l'université : rien n'est copié sur le site). */
export const DOCUMENTS = {
  plaquette: {
    titre: "La plaquette de la bi-licence",
    detail: "PDF · 2 pages · présentation, conditions d’accès et maquette complète",
    url: SOURCES[0].url,
  },
  fiche: {
    titre: "La fiche de la formation",
    detail: "PDF · 10 pages · objectifs, organisation, admission, contacts, programme",
    url: SOURCES[1].url,
  },
  pageUM: {
    titre: "La page de la formation sur le site de l’université",
    url: "https://formations.umontpellier.fr/fr/formations/licence-XA/licence-economie-science-politique-KIIW3I1D.html",
  },
  facEco: { titre: "Faculté d’Économie", url: "https://economie.edu.umontpellier.fr/" },
  facDroit: { titre: "Faculté de Droit et de Science politique", url: "https://droit.edu.umontpellier.fr/science-politique/" },
  candidatures: { titre: "Candidatures et admissions", url: "https://economie.edu.umontpellier.fr/candidatures/candidatures-et-admissions/" },
  international: { titre: "Partir à l’étranger", url: "https://economie.edu.umontpellier.fr/international/" },
  stages: { titre: "Partir en stage", url: "https://economie.edu.umontpellier.fr/carriere/partir-en-stage/" },
  scolarite: { titre: "Scolarité", url: "https://economie.edu.umontpellier.fr/scolarite/" },
};

/** Contacts administratifs publiés sur la fiche de l'UM. */
export const CONTACTS_ADMINISTRATIFS: { nom: string; telephone?: string; email: string }[] = [
  {
    nom: "Scolarité des licences de Droit et de Science politique",
    telephone: "04 34 43 28 09",
    email: "dsp-scola-licences@umontpellier.fr",
  },
  {
    nom: "Scolarité de la licence d’Économie",
    email: "eco-scolarite-licence@umontpellier.fr",
  },
];

export const PLAQUETTE = {
  // Texte du document Word « Bi-licence Économie et Science politique », convenu avec le service des plaquettes.
  presentation: [
    `La bi-licence «${NBSP}économie-science politique${NBSP}» est une formation à capacité limitée dispensée à l’Université de Montpellier depuis 2021. Résolument pluridisciplinaire, elle se propose de répondre aux exigences des nouveaux métiers porteurs, notamment dans les domaines de l’environnement, de l’énergie, de l’aide à la décision, des projets de développement, de la gouvernance transnationale et de la régulation des sociétés complexes. Elle vise à former des cadres disposant de compétences en économie, en science politique et, plus généralement, en sciences sociales et dans les institutions nationales et internationales, capables d’occuper des postes à responsabilité dans les secteurs public et privé, en France ou à l’international.`,
    "Les étudiants suivent les enseignements fondamentaux des deux licences : science économique sur le site de Richter et science politique sur le site de la Faculté de droit et de science politique. L’Université de Montpellier est l’une des seules à proposer ce type de cursus. La validation de la formation suppose le passage d’un grand oral bi-disciplinaire portant sur les apports des deux disciplines à l’analyse du monde contemporain. Cette double compétence permet ensuite de candidater aux masters de chaque discipline ou à des masters pluridisciplinaires co-habilités en science politique et en science économique.",
  ],
  atouts: [
    "Une formation résolument pluridisciplinaire",
    "Une réponse aux nouveaux métiers porteurs",
    "Un diplôme commun avec la Faculté de Droit et de Science politique",
  ],
  objectifs: [
    "Acquérir une double compétence solide en économie et en science politique",
    "Développer une capacité d’analyse pluridisciplinaire des enjeux contemporains (économiques, politiques, institutionnels, sociaux)",
    "Comprendre les dynamiques nationales et internationales de gouvernance et de régulation",
    "Renforcer les outils d’aide à la décision et d’évaluation des politiques publiques",
    "Croiser les approches des sciences sociales pour analyser des situations complexes",
    "Préparer l’accès à des masters sélectifs en économie, science politique ou parcours pluridisciplinaires",
    "Former à des fonctions à responsabilité dans les secteurs public et privé, en France comme à l’international",
  ],
  savoirFaire: [
    "Mobiliser conjointement les outils de l’économie et de la science politique",
    "Analyser une situation économique, institutionnelle ou politique complexe",
    "Exploiter des données quantitatives et qualitatives",
    "Construire un diagnostic et formuler des recommandations argumentées",
    "Évaluer des politiques publiques et des dispositifs de régulation",
    "Réaliser des notes de synthèse et des rapports d’analyse",
    "Présenter une problématique à l’oral dans un cadre bi-disciplinaire",
    "Travailler en mode projet et en équipe pluridisciplinaire",
  ],
  competences: [
    "Double culture en économie et en science politique",
    "Maîtrise des concepts clés des sciences sociales",
    "Capacité d’analyse critique et de mise en perspective",
    "Compréhension des institutions et des mécanismes de gouvernance",
    "Rigueur méthodologique et esprit de synthèse",
    "Autonomie dans le travail et l’organisation",
    "Capacités rédactionnelles et argumentatives",
    "Aptitude à la prise de décision éclairée et à l’expertise",
  ],
  attendus: [
    "Un intérêt prononcé pour les questions économiques, politiques et sociales et, plus largement, pour le fonctionnement des sociétés contemporaines",
    "Une aptitude réelle à l’expression écrite et orale",
    "Des compétences confirmées en mathématiques-statistiques",
    "Une capacité manifeste à la compréhension et à l’analyse de documents",
    "Des dispositions avérées à travailler de façon autonome et organisée",
  ],
  /** Ce que la commission d'examen regarde pour un vœu en première année. */
  examens: [
    "Les notes de première, de terminale et du baccalauréat (épreuves anticipées et finales pour les candidats bacheliers)",
    "Le socle de culture commune : français, philosophie, histoire-géographie, enseignement moral et civique, langues vivantes, humanités scientifiques et numériques",
    "Les disciplines de spécialité : histoire-géographie, géopolitique et science politique ; sciences économiques et sociales ; humanités, littérature et philosophie ; mathématiques ; langues et littératures étrangères ; numérique et sciences informatiques",
    `Les enseignements facultatifs : droit et grands enjeux du monde contemporain${NBSP}; langue vivante 3`,
    "La fiche Avenir",
    "La cohérence du projet de formation",
  ],
  publicCible:
    "Le public cible de la bi-licence Économie – Science politique est constitué d’étudiantes et d’étudiants à fort potentiel académique, curieux des enjeux économiques, politiques et institutionnels contemporains, et désireux de suivre une formation exigeante et sélective. Ce cursus s’adresse à des profils attirés par les sciences sociales, l’analyse des politiques publiques et des transformations économiques, disposant de bonnes capacités de raisonnement, de rédaction et d’argumentation, ainsi que d’une aisance avec les outils quantitatifs.",
  droits:
    "Les frais de scolarité sont fixés chaque année par le ministère chargé de l’Enseignement supérieur. Ils s’accompagnent de la Contribution de vie étudiante et de campus (CVEC). L’ensemble est exonéré pour les étudiants boursiers.",
  international:
    "Dès la deuxième année, les étudiants peuvent partir dans l’une des 60 universités avec lesquelles la Faculté d’Économie est partenaire, dans le cadre des programmes d’échanges Erasmus+, de conventions inter-universitaires et de CHARM-EU.",
  controle: [
    "La licence est structurée en trois années et six semestres. À la fin de chaque semestre, les aptitudes, les compétences et les connaissances liées à chaque unité d’enseignement (UE) sont évaluées de deux façons possibles : le contrôle continu ou l’examen terminal.",
    "Le contrôle continu permet un suivi régulier de la progression grâce à plusieurs formes d’évaluation : devoirs surveillés, travaux dirigés notés, exposés, projets, analyses de documents ou encore participation active en cours.",
    "L’examen terminal consiste en une épreuve écrite ou orale organisée à la fin du semestre. Il vise à vérifier la maîtrise globale des notions enseignées et la capacité à mobiliser ses connaissances de façon structurée et approfondie.",
  ],
  grandOral:
    "Cette épreuve transversale demande aux étudiants de mobiliser conjointement les apports de l’économie et de la science politique pour analyser une problématique contemporaine. Elle évalue à la fois les capacités de synthèse, d’argumentation, de mise en perspective interdisciplinaire et de présentation orale. Ce grand oral constitue un temps fort de la formation et valide la cohérence de la double compétence acquise.",
  amenagements:
    "Les étudiants en situation de handicap, les jeunes entrepreneurs et les sportifs de haut niveau peuvent bénéficier d’un accompagnement personnalisé : aménagements d’études, adaptations pédagogiques ou droits spécifiques, afin de concilier au mieux leurs contraintes personnelles ou professionnelles avec leur formation. Selon les situations, cela peut inclure un emploi du temps adapté, des modalités d’évaluation aménagées, des facilités d’assiduité, un suivi individualisé ou des services d’accompagnement dédiés.",
  stage: [
    "En licence, le stage est possible et facultatif. Il doit être en lien avec la formation : véritable immersion dans le monde professionnel, il permet d’appliquer les connaissances acquises en cours, de découvrir le fonctionnement des organisations et de confronter la théorie à la pratique.",
    "Le stage peut commencer à la fin des examens du second semestre ou être réalisé pendant les périodes de vacances universitaires. Dans tous les cas, il doit impérativement se terminer au plus tard le 31 août. Attention : le démarrage du stage immédiatement après les examens du second semestre n’est possible que si l’étudiant a validé son année dès la première session.",
  ],
  optionsFacultatives:
    "Remise à niveau en mathématiques, sport, projet étudiant, engagement étudiant, préparation à la certification Voltaire, PIX, préparation au TOEIC et, au second semestre, découverte du spectacle vivant. Renseignements auprès du service de la scolarité (bureau 114).",
  stageFacultatif:
    "Possibilité d’effectuer un stage afin d’acquérir des compétences en cohérence avec la formation. Renseignements auprès du service des stages et de l’insertion professionnelle (bureau 113).",
  poursuite:
    "La double compétence acquise a vocation à faciliter l’accès aux meilleurs masters de chacune des deux disciplines, ainsi qu’à des masters pluridisciplinaires co-accrédités en science politique et en science économique, afin de préparer les étudiants aux métiers à forte évolution et aux besoins émergents du marché du travail.",
};
