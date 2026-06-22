import 'dotenv/config';
import { db } from './database.js';
import './migrate.js';
import { hashPassword } from '../services/authService.js';
import { voteWeightForKarma } from '../services/karmaService.js';
import { refreshBadgesForUser } from '../services/badgeService.js';
import { evaluateWithFallback } from '../services/ai.js';

// ── Limpiar datos previos ──────────────────────────────────────────────────────
db.exec(`
  DELETE FROM user_badges;
  DELETE FROM community_members;
  DELETE FROM follows;
  DELETE FROM votes;
  DELETE FROM evidence_evaluations;
  DELETE FROM competence_suggestions;
  DELETE FROM evidences;
  DELETE FROM communities;
  DELETE FROM users;
`);

const password = await hashPassword('password123');

// ── Helpers ────────────────────────────────────────────────────────────────────
const createUser = db.prepare(
  'INSERT INTO users (name, email, password_hash, headline, bio, karma) VALUES (?, ?, ?, ?, ?, ?)'
);

function user(name, email, headline, bio, karma) {
  return createUser.run(name, email, password, headline, bio, karma).lastInsertRowid;
}

// ── 15 Usuarios profesionales ──────────────────────────────────────────────────
const ana      = user('Ana Torres',         'ana@example.com',      'Frontend Developer & Mentora React',              'Construyo interfaces de aprendizaje y evidencias técnicas verificables. Especialista en accesibilidad web y design systems.', 128);
const luis     = user('Luis Mejía',         'luis@example.com',     'Técnico Electricista Residencial',                'Diagnostico y documento instalaciones eléctricas con evidencia verificable. Certificado en seguridad NTC-2050.', 97);
const sofia    = user('Sofía Rojas',        'sofia@example.com',    'Investigadora de Saberes Tradicionales',           'Registro procesos de aprendizaje empírico: plantas medicinales, lenguas nativas y validación comunitaria.', 74);
const carlos   = user('Carlos Mendoza',     'carlos@example.com',   'Ingeniero de Software & Arquitecto de APIs',      'Diseño microservicios, APIs REST/GraphQL y flujos de CI/CD. Apasionado por la documentación técnica y los sistemas distribuidos.', 210);
const valeria  = user('Valeria Gómez',      'valeria@example.com',  'UX/UI Designer & Design Thinking Facilitator',    'Creo experiencias digitales accesibles y centradas en el usuario. Facilitadora de talleres de ideación y prototipado rápido.', 165);
const miguel   = user('Miguel Ángel Ruiz',  'miguel@example.com',   'Carpintero Artesanal & Ebanista',                 'Fabrico muebles a medida combinando técnicas tradicionales y maquinado CNC. Docento en talleres de formación para el trabajo.', 88);
const laura    = user('Laura Suárez',       'laura@example.com',    'Científica de Datos & Analista BI',               'Transformo datos en decisiones: modelos predictivos, dashboards y pipelines ETL con Python, SQL y Spark.', 142);
const andres   = user('Andrés Castillo',    'andres@example.com',   'DevOps Engineer & SRE',                           'Automatizo infraestructura con Terraform, Kubernetes y GitHub Actions. Defensor del observability y la cultura de blameless postmortems.', 189);
const diana    = user('Diana Morales',      'diana@example.com',    'Pintora Artística & Gestora Cultural',            'Combino técnicas de óleo, acrílico y arte digital. Gestiono proyectos culturales y talleres comunitarios de expresión plástica.', 56);
const jorge    = user('Jorge Peña',         'jorge@example.com',    'Soldador Certificado & Instructor Técnico',       'Especialista en soldadura MIG/TIG y estructuras metálicas. Instructor en SENA con más de 8 años de experiencia en campo.', 112);
const camila   = user('Camila Herrera',     'camila@example.com',   'Investigadora Bilingüe & Traductora Técnica',     'Traduzco documentación científica y técnica entre español, inglés y francés. Investigo terminología especializada en ingeniería.', 63);
const rodrigo  = user('Rodrigo Vargas',     'rodrigo@example.com',  'Zapatero Artesanal & Emprendedor',                'Diseño y fabrico calzado artesanal en cuero con proceso documentado desde el patronaje hasta el acabado final.', 45);
const natalia  = user('Natalia Ospina',     'natalia@example.com',  'Full Stack Developer & Tech Lead',                'Lidero equipos de desarrollo con stack Node + React. Apasionada por la arquitectura limpia y los sistemas escalables.', 234);
const esteban  = user('Esteban Quiroga',    'esteban@example.com',  'Especialista en Seguridad Informática',           'Realizo auditorías de seguridad, pruebas de penetración y análisis de vulnerabilidades en aplicaciones web y APIs.', 177);
const juliana  = user('Juliana Restrepo',   'juliana@example.com',  'Educadora & Diseñadora Instruccional',            'Diseño rutas de aprendizaje basadas en evidencia y metodologías activas: ABP, aula invertida y evaluación auténtica.', 91);

// ── 10 Comunidades temáticas ───────────────────────────────────────────────────
const createCommunity = db.prepare(
  'INSERT INTO communities (name, slug, area, description, owner_id) VALUES (?, ?, ?, ?, ?)'
);

const webCom      = createCommunity.run('Desarrollo Web & Mobile',        'desarrollo-web',           'Software',                      'React, Vue, APIs REST, bases de datos y despliegue de productos web y móviles. Compartimos evidencias de proyectos reales.',                         ana).lastInsertRowid;
const dataCom     = createCommunity.run('Ciencia de Datos & BI',          'ciencia-de-datos',         'Datos e Inteligencia',          'Python, SQL, Spark, Power BI y modelos predictivos. Validamos competencias analíticas con datasets y notebooks.',                                   laura).lastInsertRowid;
const devopsCom   = createCommunity.run('DevOps & Cloud Engineering',     'devops-cloud',             'Infraestructura',               'Terraform, Kubernetes, CI/CD, observabilidad y cultura SRE. Evidencias de automatización e infraestructura como código.',                        andres).lastInsertRowid;
const secCom      = createCommunity.run('Ciberseguridad & Hacking Ético', 'ciberseguridad',           'Seguridad',                     'Pentesting, OWASP, análisis de vulnerabilidades y hardening. Evidencias de auditorías y CTF documentados.',                                      esteban).lastInsertRowid;
const uxCom       = createCommunity.run('UX/UI & Design Systems',         'ux-ui-design',             'Diseño de Producto',            'Prototipado, investigación de usuarios, sistemas de diseño y accesibilidad. Validamos con evidencias de proyectos reales.',                      valeria).lastInsertRowid;
const officiosCom = createCommunity.run('Oficios Técnicos Certificados',  'oficios-tecnicos',         'Oficios Técnicos',              'Electricidad, soldadura, carpintería, zapatería y mecánica. Evidencias con bitácora, fotos y materiales verificables.',                          jorge).lastInsertRowid;
const arteCom     = createCommunity.run('Arte, Diseño & Expresión',       'arte-y-diseno',            'Creativa y Cultural',           'Pintura, ilustración, fotografía y gestión cultural. Evidencias de proceso creativo y exhibiciones documentadas.',                             diana).lastInsertRowid;
const saberCom    = createCommunity.run('Saberes Tradicionales & Cultura','saberes-tradicionales',    'Cultura y Aprendizaje Empírico','Plantas medicinales, lenguas nativas, oficios ancestrales y validación comunitaria. Preservamos conocimiento con rigor.',                       sofia).lastInsertRowid;
const eduCom      = createCommunity.run('Educación & Diseño Instruccional','educacion-aprendizaje',   'Educación',                     'Pedagogías activas, rutas de aprendizaje, evaluación auténtica y diseño de cursos. Comunidad de docentes y facilitadores.',                   juliana).lastInsertRowid;
const backendCom  = createCommunity.run('Backend & Arquitectura de Software','backend-arquitectura',  'Software',                      'Node.js, microservicios, bases de datos, patrones de diseño y APIs. Evidencias de arquitectura y soluciones de ingeniería.',                    carlos).lastInsertRowid;

// ── Membresías ─────────────────────────────────────────────────────────────────
const join = db.prepare('INSERT OR IGNORE INTO community_members (community_id, user_id) VALUES (?, ?)');
const memberships = [
  [webCom, ana], [webCom, carlos], [webCom, natalia], [webCom, valeria], [webCom, andres],
  [dataCom, laura], [dataCom, carlos], [dataCom, andres], [dataCom, esteban],
  [devopsCom, andres], [devopsCom, carlos], [devopsCom, natalia], [devopsCom, esteban],
  [secCom, esteban], [secCom, andres], [secCom, carlos],
  [uxCom, valeria], [uxCom, ana], [uxCom, juliana], [uxCom, diana],
  [officiosCom, jorge], [officiosCom, luis], [officiosCom, miguel], [officiosCom, rodrigo],
  [arteCom, diana], [arteCom, sofia], [arteCom, camila],
  [saberCom, sofia], [saberCom, camila], [saberCom, juliana],
  [eduCom, juliana], [eduCom, sofia], [eduCom, camila], [eduCom, valeria],
  [backendCom, carlos], [backendCom, natalia], [backendCom, andres], [backendCom, esteban]
];
memberships.forEach(([cid, uid]) => join.run(cid, uid));

// ── Red de seguidores ─────────────────────────────────────────────────────────
const follow = db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)');
const follows = [
  [ana, carlos], [ana, natalia], [ana, valeria], [ana, laura],
  [carlos, natalia], [carlos, andres], [carlos, esteban], [carlos, ana],
  [natalia, carlos], [natalia, andres], [natalia, ana],
  [andres, carlos], [andres, esteban], [andres, natalia],
  [esteban, andres], [esteban, carlos],
  [valeria, ana], [valeria, juliana], [valeria, diana],
  [laura, carlos], [laura, andres],
  [jorge, luis], [jorge, miguel],
  [sofia, camila], [sofia, juliana],
  [juliana, sofia], [juliana, valeria], [juliana, diana],
  [miguel, jorge], [miguel, rodrigo],
  [luis, jorge],
  [diana, sofia], [diana, camila],
  [camila, sofia],
  [rodrigo, miguel]
];
follows.forEach(([a, b]) => follow.run(a, b));

// ── Helper de evidencias ───────────────────────────────────────────────────────
const createEvidence = db.prepare(`
  INSERT INTO evidences
    (title, body, author_id, community_id, skill_area, evidence_type, assessment_mode, learning_sources,
     challenge_answers, artifact_url, artifact_file_name, artifact_mime_type, artifact_hash, artifact_size, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const createSuggestion = db.prepare(`
  INSERT INTO competence_suggestions (evidence_id, name, level, confidence, rationale, source)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const createEvaluation = db.prepare(`
  INSERT INTO evidence_evaluations
    (evidence_id, overall_score, status, rubric_json, risk_flags_json, human_review_required, rationale, source, provider_model, evidence_hash)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const createVote = db.prepare(`
  INSERT INTO votes (evidence_id, user_id, value, weight, weighted_value, comment)
  VALUES (?, ?, ?, ?, ?, ?)
`);

function seedEvidence({ title, body, authorId, communityId, skillArea, evidenceType, assessmentMode = 'evidencia_practica', learningSources = '', challengeAnswers = '', artifactUrl = '', votes = [] }) {
  const evaluation = evaluateWithFallback({ title, body, skillArea, evidenceType, assessmentMode, learningSources, challengeAnswers, artifactUrl });
  const evidenceId = createEvidence.run(
    title, body, authorId, communityId, skillArea, evidenceType, assessmentMode,
    learningSources, challengeAnswers, artifactUrl, '', '', '', 0, evaluation.status
  ).lastInsertRowid;

  evaluation.detectedCompetences.forEach((s) => {
    createSuggestion.run(evidenceId, s.name, s.level, s.confidence, s.rationale, s.source);
  });
  createEvaluation.run(
    evidenceId, evaluation.overallScore, evaluation.status,
    JSON.stringify(evaluation.rubric), JSON.stringify(evaluation.riskFlags),
    evaluation.humanReviewRequired ? 1 : 0,
    evaluation.rationale, evaluation.source, evaluation.providerModel ?? '', evaluation.evidenceHash
  );
  votes.forEach(([userId, value, comment]) => {
    const karma = db.prepare('SELECT karma FROM users WHERE id = ?').get(userId).karma;
    const weight = voteWeightForKarma(karma);
    createVote.run(evidenceId, userId, value, weight, value * weight, comment);
  });
  return evidenceId;
}

// ════════════════════════════════════════════════════════════════════════════════
// EVIDENCIAS — Software & Web
// ════════════════════════════════════════════════════════════════════════════════

seedEvidence({
  title: 'Dashboard React para seguimiento académico con métricas en tiempo real',
  body: 'Implementé una aplicación React con Vite, Zustand y React Router para gestionar evidencias académicas. Construí filtros dinámicos, componentes reutilizables y visualización de datos (recharts) para analizar progreso por competencia. Documenté componentes, rutas protegidas, consumo de API REST y pruebas de build. El resultado fue un dashboard funcional con +8 vistas, autenticación JWT y despliegue continuo en GitHub Actions.',
  authorId: ana, communityId: webCom, skillArea: 'software', evidenceType: 'proyecto', assessmentMode: 'mixta',
  learningSources: 'Documentación oficial de React, tutoriales de Vite, ejemplos de React Router, curso Scrimba de Zustand y notas propias de implementación.',
  challengeAnswers: 'Elegí componentes reutilizables para separar captura de evidencias, listado y mapa visual. Si el API cambiara, aislaría el cambio en el cliente REST y mantendría las pantallas. El error más probable era perder el token JWT, por eso verifiqué rutas protegidas con un guard middleware y build de producción. La mayor complejidad fue el estado global compartido entre el formulario wizard y la vista de evaluación.',
  artifactUrl: 'https://github.com/Jonevan369/skillcert-integracion-continua',
  votes: [[carlos, 1, 'Arquitectura sólida, documentación clara y build verificable.'], [natalia, 1, 'Excelente separación de responsabilidades y manejo de estado.'], [valeria, 1, 'UX bien pensada, componentes accesibles.']]
});

seedEvidence({
  title: 'Arquitectura de microservicios con Node.js y API Gateway',
  body: 'Diseñé e implementé una arquitectura de microservicios con 4 servicios independientes (auth, users, evidences, notifications) usando Node.js/Express, comunicación via HTTP y eventos con un message broker. Configuré un API Gateway con rate limiting, autenticación JWT y circuit breaker. Documenté cada servicio con OpenAPI 3.0 y automaticé tests de contrato con Jest. El sistema soporta +500 req/s en pruebas de carga.',
  authorId: carlos, communityId: backendCom, skillArea: 'software', evidenceType: 'proyecto', assessmentMode: 'mixta',
  learningSources: 'Libro "Building Microservices" (Sam Newman), documentación de Express y Node, tutoriales de Kong API Gateway, documentación de Jest y artículos técnicos de Martin Fowler.',
  challengeAnswers: 'Decidí microservicios por la necesidad de escalar auth y evidences independientemente. El principal riesgo era la consistencia distribuida: lo resolví con eventos idempotentes y un patrón saga simplificado. Si un servicio falla, el circuit breaker retorna una respuesta degradada. El test de contrato garantiza que los consumidores no se rompan con cambios de contrato.',
  artifactUrl: 'https://github.com/carlos-dev/microservices-platform',
  votes: [[natalia, 1, 'Arquitectura robusta, bien documentada y con pruebas.'], [andres, 1, 'Circuit breaker y API Gateway correctamente implementados.'], [esteban, 1, 'Buena atención a la seguridad en el gateway.']]
});

seedEvidence({
  title: 'Full Stack: e-commerce con Next.js, Prisma y Stripe',
  body: 'Construí un e-commerce completo con Next.js 14 (App Router), Prisma ORM sobre PostgreSQL, autenticación con NextAuth y pagos reales con Stripe Webhooks. Implementé búsqueda full-text, carrito persistente en Redis, optimización de imágenes y SSR para SEO. El proyecto tiene 98/100 en Lighthouse y maneja +1000 productos con paginación cursor-based.',
  authorId: natalia, communityId: webCom, skillArea: 'software', evidenceType: 'proyecto', assessmentMode: 'evidencia_practica',
  learningSources: 'Documentación de Next.js 14, Prisma docs, guías de Stripe Webhooks, curso de Lee Robinson sobre App Router y documentación de Redis.',
  challengeAnswers: 'El mayor desafío fue sincronizar el estado del carrito entre el cliente y servidor sin race conditions: lo resolví con optimistic updates y reconciliación server-side. Para los webhooks de Stripe, implementé idempotency keys para evitar doble procesamiento. El cache de Redis redujo las queries a DB en un 70%.',
  artifactUrl: 'https://github.com/natalia-dev/nextjs-ecommerce',
  votes: [[ana, 1, 'Proyecto de nivel profesional, bien documentado.'], [carlos, 1, 'Arquitectura Next.js impecable, manejo de estado correcto.'], [valeria, 1, 'Excelente UX y métricas de performance.']]
});

seedEvidence({
  title: 'Pipeline ETL automatizado con Python, Airflow y Spark',
  body: 'Diseñé un pipeline ETL para procesar 10M de registros diarios de logs de usuario. Implementé el proceso en Python con PySpark para la transformación, Apache Airflow para la orquestación de tareas y almacenamiento en un Data Warehouse en BigQuery. El pipeline detecta anomalías automáticamente, envía alertas a Slack y tiene cobertura de tests del 85%.',
  authorId: laura, communityId: dataCom, skillArea: 'datos', evidenceType: 'proyecto', assessmentMode: 'mixta',
  learningSources: 'Documentación de Apache Airflow, libro "Designing Data-Intensive Applications", curso de PySpark en Coursera, documentación de BigQuery y artículos técnicos de Spotify Engineering.',
  challengeAnswers: 'El bottleneck inicial era la serialización de datos: lo resolví usando formato Parquet con compresión Snappy, reduciendo el tiempo de procesamiento en 60%. La detección de anomalías usa un modelo de isolation forest entrenado con datos históricos. Si los datos cambian de esquema, el pipeline falla rápido con un mensaje descriptivo gracias a validaciones con Great Expectations.',
  artifactUrl: 'https://github.com/laura-data/etl-pipeline',
  votes: [[carlos, 1, 'Solución de escala real, bien documentada.'], [andres, 1, 'Excelente orquestación con Airflow, buen manejo de errores.']]
});

seedEvidence({
  title: 'Infraestructura como código: Kubernetes en GKE con Terraform y ArgoCD',
  body: 'Provisioné un cluster Kubernetes en Google Kubernetes Engine usando Terraform para la infraestructura y Helm charts para las aplicaciones. Configuré ArgoCD para GitOps, Prometheus + Grafana para observabilidad y Cert-Manager para TLS automático. El sistema tiene auto-scaling horizontal, rollbacks automáticos y un MTTR de <5 minutos documentado en postmortems.',
  authorId: andres, communityId: devopsCom, skillArea: 'infraestructura', evidenceType: 'proyecto', assessmentMode: 'evidencia_practica',
  learningSources: 'Documentación de Terraform, Kubernetes official docs, libro "The Phoenix Project", cursos de CNCF y documentación de ArgoCD y Prometheus.',
  challengeAnswers: 'El mayor reto fue el manejo de secrets: implementé External Secrets Operator con Google Secret Manager para no hardcodear credenciales en el repositorio. Para el auto-scaling, configuré HPA y VPA con métricas personalizadas de Prometheus. Los rollbacks automáticos de ArgoCD me han salvado 3 veces en producción.',
  artifactUrl: 'https://github.com/andres-devops/gke-infrastructure',
  votes: [[carlos, 1, 'IaC de nivel producción, bien documentado.'], [esteban, 1, 'Excelente manejo de secrets y observabilidad.'], [natalia, 1, 'El GitOps con ArgoCD es la mejor práctica actual.']]
});

seedEvidence({
  title: 'Auditoría de seguridad OWASP Top 10 en aplicación web de salud',
  body: 'Realicé una auditoría de seguridad completa sobre una aplicación web de gestión de historias clínicas usando la metodología OWASP Top 10. Identifiqué 3 vulnerabilidades críticas (SQL injection, IDOR y exposición de datos sensibles), documenté el vector de ataque con PoC, propuse remediaciones y verifiqué su implementación. El reporte final incluye CVSS scoring y priorización por riesgo.',
  authorId: esteban, communityId: secCom, skillArea: 'seguridad', evidenceType: 'proyecto', assessmentMode: 'mixta',
  learningSources: 'OWASP Testing Guide v4.2, PortSwigger Web Security Academy, curso CEH v12, documentación de Burp Suite Pro y writeups de HackerOne.',
  challengeAnswers: 'Para la SQL injection, identifiqué un endpoint de búsqueda que concatenaba directamente el input del usuario. El PoC extrajo la tabla de usuarios sin autenticación. La remediación fue parametrizar todas las queries con ORM. El IDOR permitía acceder a historias clínicas de otros pacientes cambiando el ID en la URL: lo remediamos con validación de ownership en el backend.',
  artifactUrl: 'https://github.com/esteban-sec/owasp-audit-report',
  votes: [[andres, 1, 'Reporte de nivel profesional, bien estructurado.'], [carlos, 1, 'Excelente PoC y propuestas de remediación claras.']]
});

seedEvidence({
  title: 'Sistema de diseño accesible con Figma y Storybook',
  body: 'Creé un sistema de diseño completo con 45+ componentes accesibles en Figma, documentados e implementados en React con Storybook. El sistema sigue WCAG 2.1 nivel AA, incluye tokens de diseño (colores, tipografía, espaciado), variantes de cada componente y guías de uso. Lo adopté en 3 proyectos diferentes logrando reducir el tiempo de desarrollo de UI en un 40%.',
  authorId: valeria, communityId: uxCom, skillArea: 'producto', evidenceType: 'proyecto', assessmentMode: 'mixta',
  learningSources: 'Documentación de WCAG 2.1, libro "Atomic Design" (Brad Frost), Figma Design Systems course, Storybook docs y guías de accesibilidad de Google Material.',
  challengeAnswers: 'El reto principal fue garantizar accesibilidad en componentes complejos como modales y dropdowns: usé ARIA roles correctamente y validé con axe-core en CI. Los tokens de diseño los manejé con Style Dictionary para sincronizar Figma con el código CSS. Si un componente no pasa la auditoría de accesibilidad, el pipeline de CI falla automáticamente.',
  artifactUrl: 'https://github.com/valeria-ux/design-system',
  votes: [[ana, 1, 'Sistema de diseño muy completo y bien documentado.'], [juliana, 1, 'La accesibilidad está perfectamente implementada.'], [diana, 1, 'Los componentes visuales son coherentes y elegantes.']]
});

// ════════════════════════════════════════════════════════════════════════════════
// EVIDENCIAS — Oficios Técnicos
// ════════════════════════════════════════════════════════════════════════════════

seedEvidence({
  title: 'Diagnóstico e instalación eléctrica residencial con bitácora verificable',
  body: 'Realicé el diagnóstico de un circuito residencial con fallas intermitentes. Usé multímetro, revisé el tablero, identifiqué un breaker fatigado, documenté la medición de voltaje (120V nominal vs 105V medido) y reemplacé el componente siguiendo la norma NTC-2050. El resultado fue la recuperación del servicio y una bitácora con fotos del antes y después, incluyendo mediciones de continuidad y verificación de tierra física.',
  authorId: luis, communityId: officiosCom, skillArea: 'tecnica', evidenceType: 'oficio', assessmentMode: 'evidencia_practica',
  learningSources: 'Manual de seguridad eléctrica residencial NTC-2050, práctica supervisada previa por técnico certificado y bitácora personal de diagnósticos del último año.',
  challengeAnswers: 'Primero aislé el circuito desenergizando en el tablero principal, luego medí voltaje y revisé continuidad con el multímetro. Si el breaker nuevo volviera a dispararse, no lo forzaría: revisaría la carga total del circuito, el calibre del cable y buscaría un posible cortocircuito con el megóhmetro. El riesgo principal era intervenir sin desenergizar o sin EPP.',
  artifactUrl: 'https://example.com/evidencias/electricidad-residencial',
  votes: [[jorge, 1, 'Proceso claro, bitácora completa y mediciones verificables.'], [miguel, 1, 'Excelente documentación de seguridad.'], [ana, 1, 'Proceso bien documentado con métricas.']]
});

seedEvidence({
  title: 'Fabricación de estructura metálica con soldadura MIG para pórtico industrial',
  body: 'Fabriqué un pórtico metálico de 6m de luz usando soldadura MIG con alambre ER70S-6 en acero A36. Realicé el corte en sierra de cinta, armado con escuadras magnéticas, soldadura en posición plana y vertical, y acabado con pintura anticorrosiva. Documenté parámetros de soldadura (voltaje 22V, velocidad de alambre 4.8 m/min, gas 80%Ar/20%CO2), inspeccioné visualmente las uniones y verifiqué la escuadría con nivel digital.',
  authorId: jorge, communityId: officiosCom, skillArea: 'tecnica', evidenceType: 'oficio', assessmentMode: 'evidencia_practica',
  learningSources: 'Manual de soldadura MIG de Lincoln Electric, norma AWS D1.1, práctica en taller con instructor certificado SENA y bitácora de 120 horas de práctica documentada.',
  challengeAnswers: 'Para garantizar la penetración correcta en los cordones de raíz ajusté los parámetros según el espesor del material (1/4"). La inspección visual detectó una porosidad en una unión: la esmerile, volví a soldar y re-inspeccioné. El riesgo más crítico en soldadura vertical es la caída del metal fundido: lo manejé con el ángulo correcto del electrodo y velocidad de avance constante.',
  artifactUrl: 'https://example.com/evidencias/portico-metalico',
  votes: [[luis, 1, 'Parámetros de soldadura correctamente documentados.'], [miguel, 1, 'Proceso de inspección y corrección impecable.'], [sofia, 1, 'Bitácora muy detallada y verificable.']]
});

seedEvidence({
  title: 'Fabricación de silla Thonet artesanal en madera maciza con ensamble tradicional',
  body: 'Construí una silla de madera maciza de roble siguiendo el diseño clásico Thonet №14, usando técnicas de carpintería tradicional: escoplado, espigas, encolado en frío y lijado progresivo (80-120-220 grit). Torneé las patas en torno de madera y apliqué acabado con shellac natural. El proceso está documentado con fotos de cada etapa, lista de materiales y especificaciones de tolerancias.',
  authorId: miguel, communityId: officiosCom, skillArea: 'tecnica', evidenceType: 'oficio', assessmentMode: 'evidencia_practica',
  learningSources: 'Libro "El taller del ebanista" (Garrido), tutoriales de Paul Sellers en YouTube, práctica en taller de formación y bitácora personal de 3 años de práctica en carpintería.',
  challengeAnswers: 'El mayor desafío fue el torneado de las patas para mantener dimensiones uniformes: usé un calibrador cada 5 vueltas para verificar el diámetro. Si la madera estuviera muy húmeda, el encolado fallaría: por eso mido la humedad con higrómetro (debe ser <12%). Las tolerancias en las espigas son críticas: ±0.5mm para que el ensamble sea firme sin forzar.',
  artifactUrl: 'https://example.com/evidencias/silla-thonet',
  votes: [[jorge, 1, 'Proceso artesanal documentado con rigor técnico.'], [rodrigo, 1, 'Excelentes tolerancias y acabado final.'], [diana, 1, 'El resultado estético y técnico es de alta calidad.']]
});

seedEvidence({
  title: 'Fabricación de calzado artesanal en cuero: Oxford clásico desde el patronaje',
  body: 'Fabriqué un par de zapatos Oxford en cuero vacuno plena flor, documentando el proceso completo: diseño del patrón en papel, corte en cuero, preparación de la horma, costura de la capellada, montado del calzado, pegado de suela de cuero y acabado con tintes y cremas de archivo. El proceso tomó 18 horas de trabajo documentadas en bitácora fotográfica con 47 imágenes.',
  authorId: rodrigo, communityId: officiosCom, skillArea: 'empirica', evidenceType: 'oficio', assessmentMode: 'evidencia_practica',
  learningSources: 'Libro "Shoemaking" (Golding), tutoriales de Carreducker en YouTube, práctica con maestro artesano por 2 años y bitácora fotográfica del proceso.',
  challengeAnswers: 'La costura de la capellada es la parte más técnica: usa hilo encerado doble para garantizar durabilidad. Si el cuero estuviera muy rígido, lo humedecería con esponja antes de montar para evitar grietas. La simetría entre ambos zapatos la garantizo usando la misma horma y midiendo los patrones al milímetro antes del corte.',
  artifactUrl: 'https://example.com/evidencias/oxford-artesanal',
  votes: [[miguel, 1, 'Proceso artesanal completo y bien documentado.'], [jorge, 1, 'Bitácora fotográfica excelente.']]
});

// ════════════════════════════════════════════════════════════════════════════════
// EVIDENCIAS — Arte, Cultura & Saberes
// ════════════════════════════════════════════════════════════════════════════════

seedEvidence({
  title: 'Serie de pinturas al óleo "Territorios de Memoria" — proceso y exhibición',
  body: 'Creé una serie de 6 pinturas al óleo sobre lienzo (80x60cm) explorando la memoria territorial y el desplazamiento. Documenté el proceso de investigación iconográfica, bocetos preparatorios, construcción de la paleta cromática, capas de imprimación, veladuras y barnizado final. La serie fue exhibida en la galería municipal y 2 piezas fueron seleccionadas para el catálogo regional de arte emergente.',
  authorId: diana, communityId: arteCom, skillArea: 'creativa', evidenceType: 'proyecto', assessmentMode: 'mixta',
  learningSources: 'Libro "La práctica del óleo" (Mayer), talleres con maestra Consuelo Ospina, documentación del proceso en bitácora de estudio y retroalimentación del jurado de selección.',
  challengeAnswers: 'El mayor reto técnico fue lograr las veladuras transparentes en las capas de fondo sin perder la textura del lienzo. Lo resolví diluyendo el pigmento con aceite de linaza en proporción 1:4 y aplicando en capas delgadas dejando secar entre cada una. La coherencia cromática de la serie la garanticé con una paleta limitada de 7 colores que se repiten en todas las piezas.',
  artifactUrl: 'https://example.com/evidencias/territorios-memoria',
  votes: [[sofia, 1, 'Proceso artístico documentado con rigor.'], [juliana, 1, 'La investigación iconográfica está muy bien fundamentada.'], [camila, 1, 'El resultado visual es poderoso y coherente.']]
});

seedEvidence({
  title: 'Registro etnobotánico de plantas medicinales con validación comunitaria',
  body: 'Documenté una práctica tradicional de uso de 15 plantas medicinales con entrevistas a 3 sabedores comunitarios, fotografías de identificación botánica, descripción morfológica, preparación de infusión/tintura y restricciones de uso documentadas. No se presenta como recomendación médica; el objetivo fue preservar conocimiento cultural con evidencia trazable. Validé la nomenclatura con la Flora de Colombia (Pérez-Arbeláez).',
  authorId: sofia, communityId: saberCom, skillArea: 'cultural', evidenceType: 'saber_empirico', assessmentMode: 'conocimiento_autonomo',
  learningSources: 'Libro de botánica "Flora de Colombia" (Pérez-Arbeláez), entrevistas con 3 sabedores comunitarios, videos de identificación botánica de Kew Gardens y bitácora fotográfica de campo.',
  challengeAnswers: 'Distingo preservación cultural de recomendación médica: cada ficha incluye advertencias explícitas sobre contraindicaciones y la recomendación de consultar un profesional de salud. Para evitar una identificación errónea de plantas similares, comparo morfología con la Flora de Colombia y valido con dos sabedores independientes. El registro es etnobotánico, no clínico.',
  artifactUrl: 'https://example.com/evidencias/plantas-medicinales',
  votes: [[camila, 1, 'Excelente rigor en la documentación y validación comunitaria.'], [juliana, 1, 'Metodología etnobotánica correctamente aplicada.'], [diana, 1, 'Trabajo de preservación cultural importante.']]
});

seedEvidence({
  title: 'Investigación lingüística: terminología técnica de ingeniería en español-inglés',
  body: 'Construí un glosario especializado de 350 términos técnicos de ingeniería de software en español-inglés con contexto de uso, ejemplos y notas de registro. El proceso incluyó análisis de corpus técnicos (IEEE, ACM), consulta con especialistas bilingües y revisión con traductores certificados. El glosario se usa actualmente en 2 equipos de desarrollo para estandarizar la documentación técnica.',
  authorId: camila, communityId: saberCom, skillArea: 'cultural', evidenceType: 'proyecto', assessmentMode: 'mixta',
  learningSources: 'Corpus IEEE/ACM, libro "Terminology: An Introduction" (Sager), consulta con traductores certificados ATA y estudio de terminología especializada en la Universidad Nacional.',
  challengeAnswers: 'El mayor desafío fue encontrar el equivalente correcto cuando no existe un término estándar en español: en esos casos documenté los términos más usados en la práctica profesional y señalé la ambigüedad. Validé cada término con al menos un profesional nativo en ambas lenguas. El glosario tiene un proceso de revisión cada 6 meses para incorporar términos emergentes.',
  artifactUrl: 'https://example.com/evidencias/glosario-tecnico',
  votes: [[sofia, 1, 'Metodología terminológica correctamente aplicada.'], [ana, 1, 'Recurso muy útil para equipos bilingües.']]
});

// ════════════════════════════════════════════════════════════════════════════════
// EVIDENCIAS — Educación & Diseño Instruccional
// ════════════════════════════════════════════════════════════════════════════════

seedEvidence({
  title: 'Diseño de ruta de aprendizaje basada en competencias para desarrollo web',
  body: 'Diseñé una ruta de aprendizaje de 6 meses para formación en desarrollo web full stack usando metodología de diseño instruccional basado en competencias. Incluye 24 módulos, 48 evidencias de desempeño, rúbricas de evaluación auténtica y actividades de aprendizaje experiencial (proyectos, laboratorios, retos). La ruta fue piloteada con 15 estudiantes con un índice de satisfacción del 94%.',
  authorId: juliana, communityId: eduCom, skillArea: 'educacion', evidenceType: 'proyecto', assessmentMode: 'mixta',
  learningSources: 'Libro "Understanding by Design" (Wiggins & McTighe), curso de diseño instruccional de ATD, documentación de marcos de competencias (DigComp) y práctica docente de 5 años.',
  challengeAnswers: 'La alineación entre objetivos de aprendizaje, actividades y evaluación fue el desafío central: usé el diseño hacia atrás (backward design) para garantizar coherencia. Si un módulo no funcionaba bien, lo detectaba en las evaluaciones formativas intermedias y ajustaba antes del módulo siguiente. El 94% de satisfacción se midió con encuesta de 20 ítems al finalizar el piloto.',
  artifactUrl: 'https://example.com/evidencias/ruta-aprendizaje-web',
  votes: [[valeria, 1, 'Diseño instruccional de alta calidad, bien fundamentado.'], [sofia, 1, 'El enfoque basado en competencias está correctamente aplicado.'], [ana, 1, 'Ruta muy bien estructurada y usable.']]
});

// ════════════════════════════════════════════════════════════════════════════════
// Refresh de badges para todos los usuarios
// ════════════════════════════════════════════════════════════════════════════════
const allUsers = [ana, luis, sofia, carlos, valeria, miguel, laura, andres, diana, jorge, camila, rodrigo, natalia, esteban, juliana];
allUsers.forEach((userId) => refreshBadgesForUser(userId));

console.log('Seed profesional completado: 15 usuarios, 10 comunidades, multiples evidencias y evaluaciones.');
