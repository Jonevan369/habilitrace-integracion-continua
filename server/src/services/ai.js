import crypto from 'node:crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_DEFAULT_MODEL = 'openrouter/free';
const GEMINI_DEFAULT_MODEL = 'gemini-1.5-flash';
const LEVELS = ['principiante', 'intermedio', 'avanzado'];
const STATUS = {
  PREVALIDATED: 'prevalidated_ai',
  REVIEW: 'needs_human_review',
  INSUFFICIENT: 'insufficient'
};

const SKILL_PATTERNS = [
  {
    pattern: /(soldadur|\bmig\b|\btig\b|\bsmaw\b|electrodo|cordon|cordón|metal|estructura metalica|estructura metálica)/i,
    name: 'Soldadura y fabricacion metalica',
    area: 'tecnica',
    highRisk: true
  },
  {
    pattern: /(electric|cablead|breaker|tablero|voltaje|instalacion residencial|circuito)/i,
    name: 'Instalacion electrica residencial',
    area: 'tecnica',
    highRisk: true
  },
  {
    pattern: /(zapato|calzado|suela|cuero|horma|costura artesanal)/i,
    name: 'Zapateria artesanal',
    area: 'empirica',
    highRisk: false
  },
  {
    pattern: /(carpinter|madera|ensamble|mueble|lijado|ebanister)/i,
    name: 'Carpinteria y ensamble',
    area: 'tecnica',
    highRisk: false
  },
  {
    pattern: /(pintur|oleo|acrilic|lienzo|mural|color|ilustracion)/i,
    name: 'Pintura artistica',
    area: 'creativa',
    highRisk: false
  },
  {
    pattern: /(planta medicinal|herbol|infusion|fitoterapia|medicina natural|botanica)/i,
    name: 'Conocimiento de plantas medicinales',
    area: 'cultural',
    highRisk: true
  },
  {
    pattern: /(idioma|lengua|traduccion|interpreta|oralidad|vocabulario)/i,
    name: 'Competencia linguistica y traduccion',
    area: 'cultural',
    highRisk: false
  },
  {
    pattern: /(react|frontend|vite|interfaz web|dashboard|componente reutilizable)/i,
    name: 'Desarrollo frontend con React',
    area: 'software',
    highRisk: false
  },
  {
    pattern: /(node|express|api|jwt|endpoint|backend|sqlite|sql)/i,
    name: 'APIs y servicios backend',
    area: 'software',
    highRisk: false
  },
  {
    pattern: /(ux|usabilidad|usuario|prototipo|wireframe|experiencia)/i,
    name: 'Diseno de experiencia de usuario',
    area: 'producto',
    highRisk: false
  },
  {
    pattern: /(investig|matriz|metodologia|estado del arte|analisis|documentacion)/i,
    name: 'Investigacion aplicada',
    area: 'academia',
    highRisk: false
  },
  {
    pattern: /(alquimia|destilacion|fermentacion|laboratorio casero|recreativa)/i,
    name: 'Experimentacion recreativa documentada',
    area: 'recreativa',
    highRisk: true
  }
];

const PROCESS_TERMS = /(diagnostiqu|disen|diseñ|construi|construí|fabriqu|fabriqué|implemente|implementé|instal|sold|repar|document|compare|midi|medí|verifiqu|verifiqué|probe|probé|coordine|coordiné)/i;
const TOOL_TERMS = /(herramient|material|equipo|software|multimetro|multímetro|electrodo|horma|pincel|api|framework|maquina|máquina|instrumento)/i;
const RESULT_TERMS = /(resultado|entregable|cliente|funciono|funcionó|prueba|evidencia|foto|video|repositorio|certificado|medicion|medición|antes|despues|después)/i;
const LEARNING_SOURCE_TERMS = /(libro|manual|curso|video|youtube|taller|documentacion|documentación|paper|articulo|artículo|mentor|clase|guia|guía|bitacora|bitácora)/i;
const DIAGNOSTIC_TERMS = /(porque|por qué|compar|si cambiara|error|falla|riesgo|criterio|decidi|decidí|correg|valid|verific|explic|aplic)/i;
const VAGUE_TERMS = /(soy bueno|se mucho|sé mucho|experto en todo|hice cosas|varias cosas|me defiendo|aprendi bastante|aprendí bastante)/i;

export async function suggestCompetences(payload) {
  const evaluation = await evaluateEvidence(payload);
  return evaluation.detectedCompetences;
}

export function getAiProviderStatus() {
  const provider = resolveAiProvider();
  return {
    provider,
    mode: provider === 'fallback' ? 'local_fallback' : 'external_model',
    model: provider === 'openrouter'
      ? process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL
      : provider === 'gemini'
        ? process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL
        : 'local-rubric-v1',
    configured: {
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY)
    },
    fallbackAvailable: true,
    humanReviewPolicy:
      'La IA genera una preevaluacion. Evidencias de alto riesgo, baja trazabilidad, baja confianza u objeciones pasan a revision humana ponderada por reputacion.'
  };
}

export async function evaluateEvidence(payload) {
  const provider = resolveAiProvider();

  if (provider === 'openrouter') {
    try {
      const { evaluation, model } = await evaluateWithOpenRouter(payload);
      return normalizeEvaluation(evaluation, payload, 'openrouter', model);
    } catch (error) {
      console.warn('OpenRouter unavailable, using fallback:', error.message);
    }
  }

  if (provider === 'gemini') {
    try {
      return normalizeEvaluation(await evaluateWithGemini(payload), payload, 'gemini', process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL);
    } catch (error) {
      console.warn('Gemini unavailable, using fallback:', error.message);
    }
  }

  return evaluateWithFallback(payload);
}

function resolveAiProvider() {
  const requested = String(process.env.AI_PROVIDER ?? 'auto').toLowerCase();
  if (requested === 'fallback') return 'fallback';
  if (requested === 'openrouter') return process.env.OPENROUTER_API_KEY ? 'openrouter' : 'fallback';
  if (requested === 'gemini') return process.env.GEMINI_API_KEY ? 'gemini' : 'fallback';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return 'fallback';
}

async function evaluateWithOpenRouter(payload) {
  const model = process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL;
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:5173',
      'X-Title': process.env.OPENROUTER_APP_TITLE || 'HabiliTrace'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Eres un evaluador academico de competencias. Responde solo JSON valido, sin markdown, en espanol claro y auditable.'
        },
        { role: 'user', content: buildEvaluationPrompt(payload) }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 240)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter no devolvio contenido evaluable.');

  return {
    evaluation: parseModelJson(content),
    model: data.model || model
  };
}

async function evaluateWithGemini(payload) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL });
  const prompt = buildEvaluationPrompt(payload);

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  return parseModelJson(text);
}

function buildEvaluationPrompt(payload) {
  return `
Eres un evaluador de competencias para un prototipo academico de ingenieria de software.
Evalua la evidencia con una rubrica objetiva. Devuelve solo JSON valido con esta forma:
{
  "detectedCompetences":[
    {"name":"Competencia", "level":"principiante|intermedio|avanzado", "confidence":0.82, "rationale":"motivo breve", "source":"gemini"}
  ],
  "overallScore":82,
  "status":"prevalidated_ai|needs_human_review|insufficient",
  "rubric":{"pertinencia":80,"claridad":80,"suficiencia":80,"complejidad":80,"coherenciaTecnica":80,"trazabilidad":80,"dominioConceptual":80,"transferencia":80},
  "riskFlags":["alerta breve"],
  "humanReviewRequired":true,
  "rationale":"explicacion breve"
}

Criterios:
- No aceptes afirmaciones vagas sin proceso, herramientas o resultado.
- Marca revision humana para oficios con riesgo fisico, salud, electricidad, soldadura o medicina natural.
- La IA produce evaluacion preliminar, no certificacion definitiva.
- Contesta en espanol, con explicaciones breves y auditables.

Titulo: ${payload.title}
Area declarada: ${payload.skillArea ?? 'general'}
Tipo de evidencia: ${payload.evidenceType ?? 'experiencia'}
Modo de evaluacion: ${payload.assessmentMode ?? 'evidencia_practica'}
Fuentes de aprendizaje: ${payload.learningSources ?? ''}
URL/soporte: ${payload.artifactUrl ?? ''}
Hash de archivo: ${payload.artifactHash ?? ''}
Evidencia: ${payload.body}
Respuestas diagnosticas del usuario: ${payload.challengeAnswers ?? ''}
`;
}

function parseModelJson(text) {
  const cleaned = String(text).replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('La IA no devolvio JSON valido.');
  }
}

export function evaluateWithFallback(payload) {
  const text = `${payload.title ?? ''} ${payload.body ?? ''}`.trim();
  const learningSources = String(payload.learningSources ?? '').trim();
  const challengeAnswers = String(payload.challengeAnswers ?? '').trim();
  const assessmentMode = String(payload.assessmentMode ?? 'evidencia_practica');
  const fullText = `${text} ${learningSources} ${challengeAnswers}`.trim();
  const normalized = text.toLowerCase();
  const matches = SKILL_PATTERNS.filter((item) => item.pattern.test(fullText));
  const detected = (matches.length ? matches : inferGenericCompetences(fullText)).slice(0, 4);
  const highRisk = detected.some((item) => item.highRisk);
  const hasArtifact = Boolean(String(payload.artifactUrl ?? '').trim() || String(payload.artifactHash ?? '').trim());
  const hasLearningPath = learningSources.length > 40 && LEARNING_SOURCE_TERMS.test(learningSources);
  const hasDiagnosticDefense = challengeAnswers.length > 120 && DIAGNOSTIC_TERMS.test(challengeAnswers);
  const knowledgeOnly = assessmentMode === 'conocimiento_autonomo';
  const mixedAssessment = assessmentMode === 'mixta';

  const rubric = {
    pertinencia: clampScore(55 + (matches.length ? 25 : 8) + declaredAreaBonus(payload.skillArea, detected)),
    claridad: clampScore(scoreForSignals(fullText.length, [PROCESS_TERMS, TOOL_TERMS, RESULT_TERMS], fullText)),
    suficiencia: clampScore(40 + (text.length > 280 ? 14 : 0) + (fullText.length > 900 ? 10 : 0) + (hasArtifact ? 18 : 0) + (hasLearningPath ? 12 : 0) + (hasDiagnosticDefense ? 14 : 0) + (/\d/.test(fullText) ? 6 : 0)),
    complejidad: clampScore(45 + (PROCESS_TERMS.test(fullText) ? 15 : 0) + (TOOL_TERMS.test(fullText) ? 12 : 0) + (/(norma|seguridad|cliente|produccion|producción|diagnostico|diagnóstico|optimiz|arquitect|avanzad|transfer|caso)/i.test(fullText) ? 18 : 0)),
    coherenciaTecnica: clampScore(50 + (PROCESS_TERMS.test(fullText) ? 10 : 0) + (TOOL_TERMS.test(fullText) ? 10 : 0) + (RESULT_TERMS.test(fullText) ? 10 : 0) + (hasDiagnosticDefense ? 12 : 0) - (VAGUE_TERMS.test(fullText) ? 18 : 0)),
    trazabilidad: clampScore(38 + (hasArtifact ? 24 : 0) + (hasLearningPath ? 18 : 0) + (/(foto|video|repositorio|certificado|captura|documento|bitacora|bitácora|hash|archivo)/i.test(fullText) ? 12 : 0) + (/\d{4}|http|www|github/i.test(`${fullText} ${payload.artifactUrl ?? ''}`) ? 8 : 0)),
    dominioConceptual: clampScore(42 + (hasLearningPath ? 18 : 0) + (hasDiagnosticDefense ? 22 : 0) + (/(concepto|principio|fundamento|teoria|teoría|metodo|método|criterio|diferencia)/i.test(fullText) ? 12 : 0) - (knowledgeOnly && !hasDiagnosticDefense ? 12 : 0)),
    transferencia: clampScore(40 + (PROCESS_TERMS.test(fullText) ? 12 : 0) + (hasDiagnosticDefense ? 18 : 0) + (/(caso|escenario|si cambiara|adapt|resolver|aplicar|apliqué|aplique|compar)/i.test(fullText) ? 16 : 0) + (mixedAssessment ? 6 : 0))
  };

  const riskFlags = buildRiskFlags({
    text,
    fullText,
    hasArtifact,
    highRisk,
    matches,
    rubric,
    assessmentMode,
    hasLearningPath,
    hasDiagnosticDefense
  });
  const overallScore = Math.round(
    rubric.pertinencia * 0.13 +
      rubric.claridad * 0.12 +
      rubric.suficiencia * 0.14 +
      rubric.complejidad * 0.12 +
      rubric.coherenciaTecnica * 0.15 +
      rubric.trazabilidad * 0.12 +
      rubric.dominioConceptual * 0.12 +
      rubric.transferencia * 0.1
  );
  const status = statusFor({ overallScore, riskFlags, highRisk });

  return normalizeEvaluation(
    {
      detectedCompetences: detected.map((item, index) => ({
        name: item.name,
        level: inferLevel(fullText, overallScore, index),
        confidence: confidenceFor(overallScore, riskFlags.length, index),
        rationale: rationaleFor(item, payload, rubric),
        source: 'fallback'
      })),
      overallScore,
      status,
      rubric,
      riskFlags,
      humanReviewRequired: status !== STATUS.PREVALIDATED || highRisk || riskFlags.length > 0,
      rationale: rationaleForEvaluation({ overallScore, status, highRisk, riskFlags, assessmentMode })
    },
    payload,
    'fallback',
    'local-rubric-v1'
  );
}

function inferGenericCompetences(text) {
  if (text.length > 700) {
    return [
      { name: 'Documentacion de evidencias de aprendizaje', area: 'transversal', highRisk: false },
      { name: 'Analisis de informacion', area: 'datos', highRisk: false }
    ];
  }

  return [
    { name: 'Aprendizaje autonomo verificable', area: 'transversal', highRisk: false },
    { name: 'Resolucion de problemas', area: 'transversal', highRisk: false }
  ];
}

function normalizeEvaluation(raw, payload, source, providerModel = '') {
  const rubric = normalizeRubric(raw.rubric);
  const overallScore = clampScore(Number(raw.overallScore ?? average(Object.values(rubric))));
  const riskFlags = Array.isArray(raw.riskFlags) ? raw.riskFlags.map((item) => String(item).slice(0, 180)).filter(Boolean) : [];
  const highRisk = /riesgo|salud|electric|soldadur|medicina|quimic|químic/i.test(`${payload.skillArea ?? ''} ${payload.title ?? ''} ${payload.body ?? ''} ${payload.challengeAnswers ?? ''}`);
  let status = [STATUS.PREVALIDATED, STATUS.REVIEW, STATUS.INSUFFICIENT].includes(raw.status)
    ? raw.status
    : statusFor({ overallScore, riskFlags, highRisk });
  if (overallScore < 58) status = STATUS.INSUFFICIENT;
  if (highRisk && status === STATUS.PREVALIDATED) status = STATUS.REVIEW;
  const detectedCompetences = normalizeSuggestions(raw.detectedCompetences ?? raw.suggestions ?? [], source);

  return {
    detectedCompetences: detectedCompetences.length ? detectedCompetences : normalizeSuggestions(inferGenericCompetences(`${payload.title ?? ''} ${payload.body ?? ''}`), source),
    overallScore,
    status,
    rubric,
    riskFlags,
    humanReviewRequired: Boolean(raw.humanReviewRequired ?? (status !== STATUS.PREVALIDATED || highRisk || riskFlags.length > 0)),
    rationale: String(raw.rationale ?? rationaleForEvaluation({ overallScore, status, highRisk, riskFlags, assessmentMode: payload.assessmentMode })).slice(0, 500),
    source,
    providerModel,
    evidenceHash: hashEvidence(payload)
  };
}

function normalizeSuggestions(items, source) {
  return items.slice(0, 5).map((item, index) => ({
    name: String(item.name ?? 'Competencia no especificada').slice(0, 90),
    level: LEVELS.includes(item.level) ? item.level : 'intermedio',
    confidence: Math.min(1, Math.max(0, Number(item.confidence ?? 0.72 - index * 0.05))),
    rationale: String(item.rationale ?? 'Sugerida por evaluacion preliminar de la evidencia.').slice(0, 260),
    source: item.source ?? source
  }));
}

function normalizeRubric(rubric = {}) {
  return {
    pertinencia: clampScore(Number(rubric.pertinencia ?? 65)),
    claridad: clampScore(Number(rubric.claridad ?? 65)),
    suficiencia: clampScore(Number(rubric.suficiencia ?? 65)),
    complejidad: clampScore(Number(rubric.complejidad ?? 65)),
    coherenciaTecnica: clampScore(Number(rubric.coherenciaTecnica ?? 65)),
    trazabilidad: clampScore(Number(rubric.trazabilidad ?? 65)),
    dominioConceptual: clampScore(Number(rubric.dominioConceptual ?? 65)),
    transferencia: clampScore(Number(rubric.transferencia ?? 65))
  };
}

function scoreForSignals(length, patterns, text) {
  return 45 + Math.min(20, Math.floor(length / 35)) + patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 10 : 0), 0);
}

function declaredAreaBonus(area, detected) {
  if (!area || area === 'general') return 0;
  return detected.some((item) => item.area === area) ? 8 : 0;
}

function buildRiskFlags({ text, fullText, hasArtifact, highRisk, matches, rubric, assessmentMode, hasLearningPath, hasDiagnosticDefense }) {
  const flags = [];
  if (text.length < 180) flags.push('La descripcion es corta; se recomienda ampliar proceso, herramientas y resultado.');
  if (!hasArtifact && assessmentMode !== 'conocimiento_autonomo') flags.push('No se adjunto URL o soporte externo verificable.');
  if (assessmentMode !== 'evidencia_practica' && !hasLearningPath) flags.push('Faltan fuentes de aprendizaje concretas: libros, videos, cursos, manuales o bitacora.');
  if (assessmentMode !== 'evidencia_practica' && !hasDiagnosticDefense) flags.push('La defensa diagnostica es insuficiente; debe explicar decisiones, errores y transferencia a otro caso.');
  if (VAGUE_TERMS.test(fullText)) flags.push('La evidencia contiene afirmaciones genericas que reducen verificabilidad.');
  if (!matches.length) flags.push('No se detecto una competencia tecnica especifica con alta precision.');
  if (highRisk) flags.push('La habilidad tiene impacto fisico, operativo o de salud; requiere revision humana.');
  if (rubric.trazabilidad < 60) flags.push('La trazabilidad es baja; faltan soportes, fechas, repositorio, fotos o bitacora.');
  return [...new Set(flags)];
}

function statusFor({ overallScore, riskFlags, highRisk }) {
  if (overallScore < 58) return STATUS.INSUFFICIENT;
  if (overallScore >= 82 && riskFlags.length === 0 && !highRisk) return STATUS.PREVALIDATED;
  return STATUS.REVIEW;
}

function inferLevel(text, score, offset) {
  if (score >= 82 || /(lider|arquitect|optimiz|producci[oó]n|norma|avanzad|supervise|supervisé)/i.test(text)) return 'avanzado';
  if (score >= 64 || PROCESS_TERMS.test(text)) return 'intermedio';
  return LEVELS[offset] ?? 'principiante';
}

function confidenceFor(score, riskCount, index) {
  return Number(Math.min(0.94, Math.max(0.48, score / 100 - riskCount * 0.04 - index * 0.05)).toFixed(2));
}

function rationaleFor(item, payload, rubric) {
  const area = payload.skillArea && payload.skillArea !== 'general' ? `area declarada ${payload.skillArea}` : 'descripcion de la evidencia';
  return `Coincide con ${area}; rubrica: pertinencia ${rubric.pertinencia}, coherencia ${rubric.coherenciaTecnica}.`;
}

function rationaleForEvaluation({ overallScore, status, highRisk, riskFlags, assessmentMode }) {
  if (status === STATUS.PREVALIDATED) {
    const suffix = assessmentMode === 'conocimiento_autonomo' ? 'ruta de aprendizaje y defensa diagnostica suficientes.' : 'proceso, herramientas y resultado con trazabilidad suficiente.';
    return `La evidencia alcanza ${overallScore}/100 y presenta ${suffix}`;
  }
  if (status === STATUS.INSUFFICIENT) return `La evidencia alcanza ${overallScore}/100; requiere mas detalle antes de asociarla a una competencia validable.`;
  const reason = highRisk ? 'por tratarse de una habilidad sensible' : riskFlags[0] ?? 'por confianza moderada';
  return `La evidencia alcanza ${overallScore}/100 y requiere revision humana ${reason}.`;
}

function hashEvidence(payload) {
  const stable = JSON.stringify({
    title: payload.title ?? '',
    body: payload.body ?? '',
    skillArea: payload.skillArea ?? 'general',
    evidenceType: payload.evidenceType ?? 'experiencia',
    assessmentMode: payload.assessmentMode ?? 'evidencia_practica',
    learningSources: payload.learningSources ?? '',
    challengeAnswers: payload.challengeAnswers ?? '',
    artifactUrl: payload.artifactUrl ?? '',
    artifactHash: payload.artifactHash ?? ''
  });
  return crypto.createHash('sha256').update(stable).digest('hex');
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}
