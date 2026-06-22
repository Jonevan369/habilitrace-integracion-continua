import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEvidence, evaluateWithFallback, getAiProviderStatus } from '../services/ai.js';

test('evaluateWithFallback returns a traceable rubric and hash', () => {
  const evaluation = evaluateWithFallback({
    title: 'Instalacion electrica residencial',
    body: 'Realice diagnostico con multimetro, revise tablero, documente medicion de voltaje y reemplace un breaker siguiendo medidas de seguridad. Inclui fotos del antes y despues.',
    skillArea: 'tecnica',
    evidenceType: 'oficio',
    artifactUrl: 'https://example.com/evidencias/electricidad'
  });

  assert.equal(evaluation.detectedCompetences[0].name, 'Instalacion electrica residencial');
  assert.ok(evaluation.overallScore >= 60);
  assert.equal(typeof evaluation.evidenceHash, 'string');
  assert.equal(evaluation.evidenceHash.length, 64);
  assert.ok(Object.hasOwn(evaluation.rubric, 'coherenciaTecnica'));
  assert.equal(evaluation.humanReviewRequired, true);
});

test('evaluateWithFallback marks vague evidence as risky or insufficient', () => {
  const evaluation = evaluateWithFallback({
    title: 'Soy experto',
    body: 'Soy bueno y se mucho porque hice varias cosas durante mucho tiempo.',
    skillArea: 'general',
    evidenceType: 'experiencia',
    artifactUrl: ''
  });

  assert.ok(evaluation.riskFlags.length >= 2);
  assert.notEqual(evaluation.status, 'prevalidated_ai');
});

test('evaluateWithFallback requires sources and diagnostic defense for autonomous knowledge', () => {
  const weak = evaluateWithFallback({
    title: 'Aprendi plantas medicinales',
    body: 'He visto videos y creo que conozco varias plantas.',
    skillArea: 'cultural',
    evidenceType: 'saber_empirico',
    assessmentMode: 'conocimiento_autonomo',
    learningSources: 'Videos',
    challengeAnswers: '',
    artifactUrl: ''
  });
  const strong = evaluateWithFallback({
    title: 'Conocimiento de plantas medicinales',
    body: 'Documente diferencias entre preservacion cultural y recomendacion medica, con restricciones de uso y fuentes comunitarias.',
    skillArea: 'cultural',
    evidenceType: 'saber_empirico',
    assessmentMode: 'conocimiento_autonomo',
    learningSources: 'Libro de botanica local, videos de identificacion, entrevistas y bitacora fotografica.',
    challengeAnswers: 'No recomendaria consumo sin validacion. Comparo forma de hoja, contexto, contraindicaciones y fuente. Si otra planta se parece, detengo la clasificacion y busco contraste botanico.',
    artifactUrl: ''
  });

  assert.ok(weak.riskFlags.length >= 2);
  assert.ok(strong.overallScore > weak.overallScore);
  assert.equal(strong.humanReviewRequired, true);
});

test('evaluateEvidence uses OpenRouter when configured and normalizes provider metadata', async (t) => {
  const previous = {
    fetch: globalThis.fetch,
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
    provider: process.env.AI_PROVIDER
  };

  t.after(() => {
    globalThis.fetch = previous.fetch;
    restoreEnv('OPENROUTER_API_KEY', previous.apiKey);
    restoreEnv('OPENROUTER_MODEL', previous.model);
    restoreEnv('AI_PROVIDER', previous.provider);
  });

  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
  process.env.OPENROUTER_MODEL = 'openrouter/free';
  process.env.AI_PROVIDER = 'openrouter';

  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-openrouter-key');

    const body = JSON.parse(options.body);
    assert.equal(body.model, 'openrouter/free');
    assert.equal(body.response_format.type, 'json_object');
    assert.match(body.messages[1].content, /API Express/);

    return {
      ok: true,
      json: async () => ({
        model: 'mock/openrouter-free-model',
        choices: [
          {
            message: {
              content: JSON.stringify({
                detectedCompetences: [
                  {
                    name: 'APIs y servicios backend',
                    level: 'avanzado',
                    confidence: 0.91,
                    rationale: 'Evidencia con API, JWT, SQLite y pruebas.',
                    source: 'openrouter'
                  }
                ],
                overallScore: 88,
                status: 'prevalidated_ai',
                rubric: {
                  pertinencia: 90,
                  claridad: 88,
                  suficiencia: 86,
                  complejidad: 84,
                  coherenciaTecnica: 90,
                  trazabilidad: 85,
                  dominioConceptual: 87,
                  transferencia: 84
                },
                riskFlags: [],
                humanReviewRequired: false,
                rationale: 'Evidencia clara, trazable y coherente.'
              })
            }
          }
        ]
      })
    };
  };

  const status = getAiProviderStatus();
  assert.equal(status.provider, 'openrouter');
  assert.equal(status.model, 'openrouter/free');

  const evaluation = await evaluateEvidence({
    title: 'API Express con JWT y SQLite',
    body: 'Implemente endpoints, autenticacion JWT, migraciones SQLite, Swagger y pruebas de errores con Zod.',
    skillArea: 'software',
    evidenceType: 'proyecto',
    assessmentMode: 'mixta',
    learningSources: 'Documentacion oficial de Express, SQLite, JWT y OpenAPI.',
    challengeAnswers: 'Verifique rutas protegidas, errores 401 y validaciones. Si cambiara la base, aislaria consultas.',
    artifactUrl: 'https://github.com/demo/api'
  });

  assert.equal(evaluation.source, 'openrouter');
  assert.equal(evaluation.providerModel, 'mock/openrouter-free-model');
  assert.equal(evaluation.detectedCompetences[0].name, 'APIs y servicios backend');
  assert.equal(evaluation.status, 'prevalidated_ai');
});

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
