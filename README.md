# HabiliTrace

HabiliTrace es una aplicacion web prototipo para evaluar competencias adquiridas en contextos formales, no formales e informales. El usuario registra evidencias de aprendizaje o experiencia; el backend ejecuta una evaluacion asistida por IA o fallback determinista; el sistema devuelve competencias detectadas, nivel, confianza, rubrica, banderas de riesgo, hash SHA-256 y estado de validacion.

El prototipo no se plantea como plataforma de entretenimiento o contactos generales. Las areas de practica y perfiles observados funcionan como soporte para trazabilidad, busqueda y revision humana cuando la IA no debe decidir sola.

## Stack

- Frontend: React, Vite, React Router, Zustand, Tailwind CSS y componentes reutilizables.
- Backend: Node.js, Express, SQLite, JWT, Swagger/OpenAPI.
- Evaluacion IA: OpenRouter opcional con `OPENROUTER_API_KEY` y modelo gratuito por defecto `openrouter/free`; Gemini opcional como alternativa; fallback local auditable si no hay clave o falla el proveedor.
- Evidencia y trazabilidad: rubrica persistida, hash SHA-256, exportacion JSON y credenciales simuladas W3C VC.

## Flujo principal

1. El usuario inicia una evaluacion de habilidad.
2. El sistema solicita area, tipo, modo de evaluacion, fuentes de aprendizaje, soporte externo y descripcion.
3. Para aprendizaje autonomo, HabiliTrace exige ruta de aprendizaje y defensa diagnostica; no basta con afirmar que se leyo un libro o se vio un video.
4. HabiliTrace evalua con una rubrica: pertinencia, claridad, suficiencia, complejidad, coherencia tecnica, trazabilidad, dominio conceptual y transferencia.
5. El sistema detecta competencias, estima nivel y confianza, y genera banderas de riesgo.
6. La evidencia queda como `prevalidated_ai`, `needs_human_review` o `insufficient`.
7. Un revisor humano puede confirmar o cuestionar evidencias, con peso segun reputacion.
8. El mapa de habilidades y las credenciales del perfil se actualizan con base en evidencias y validaciones.

## Instalacion

```bash
npm install
cp server/.env.example server/.env
npm run db:migrate
npm run db:seed
npm run dev
```

URLs:

- Frontend: http://localhost:5173
- API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs
- Estadisticas de plataforma: http://localhost:4000/api/stats
- Estado IA: http://localhost:4000/api/ai/status

## Que es `/api` y que es Swagger

La ruta `http://localhost:4000/api` no es una pagina visual como el frontend. Es la entrada de la API REST y devuelve informacion tecnica en JSON. Si se abre en el navegador debe mostrar nombre, version y rutas principales.

Swagger es una interfaz web para explorar y probar la API sin escribir codigo. En `http://localhost:4000/api/docs` se pueden ver endpoints como login, evidencias, perfiles y credenciales. Para probar endpoints protegidos:

1. Ejecutar `POST /auth/login` con un usuario demo.
2. Copiar el `token` de la respuesta.
3. Pulsar `Authorize`.
4. Pegar solo el token JWT. Swagger agrega `Bearer` automaticamente.
5. Probar endpoints protegidos como `POST /evidences`.

## IA real vs fallback local

HabiliTrace usa modo `auto`:

- Si existe `OPENROUTER_API_KEY`: consume OpenRouter con `OPENROUTER_MODEL`, por defecto `openrouter/free`.
- Si no hay OpenRouter pero existe `GEMINI_API_KEY`: consume Gemini.
- Si no hay clave o el proveedor falla: usa fallback local auditable con reglas, rubrica y hash.

Para conectar OpenRouter:

```bash
cp server/.env.example server/.env
# Editar server/.env
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="openrouter/free"
npm run dev
```

No subas `server/.env` al repositorio. Si la clave falla o no existe, el sistema no se cae: registra una advertencia y usa el fallback local. Para una entrega academica esto permite demostrar el flujo completo aunque no haya presupuesto o disponibilidad de API externa.

Si Vite cambia de puerto porque `5173` esta ocupado, el backend acepta automaticamente puertos locales `5170-5179`. Tambien puedes definir varios origenes en `CLIENT_URL` separados por coma.

Cada evidencia guarda `evaluation.source` y `evaluation.providerModel` para mostrar si fue evaluada por OpenRouter, Gemini o fallback local.

## Revision humana

La IA no certifica sola. HabiliTrace separa tres niveles:

1. **Preevaluacion IA:** detecta competencias, puntua rubrica, genera hash y propone estado.
2. **Revision requerida:** se activa si la evidencia es sensible, tiene baja trazabilidad, baja confianza, descripcion vaga o riesgo fisico/salud/electricidad/soldadura.
3. **Consenso humano ponderado:** otros usuarios confirman o cuestionan la evidencia. El peso del voto depende de la reputacion del revisor.

Esto se puede explicar como un modelo de trazabilidad academica: la IA acelera la lectura inicial, pero la validacion social y humana reduce riesgos cuando la decision no debe ser automatica.

Usuarios de prueba:

- `ana@example.com` / `password123`
- `luis@example.com` / `password123`
- `sofia@example.com` / `password123`

## Scripts

```bash
npm run dev          # frontend + backend
npm run build        # build frontend
npm run start        # backend
npm run db:migrate   # crea/actualiza SQLite
npm run db:seed      # datos base de prueba
npm run test -w server
```

## Funcionalidades implementadas

- Registro/login con JWT y rutas protegidas.
- Evaluacion guiada de habilidades por area, tipo y modo: practica, conocimiento autonomo o mixta.
- Integracion OpenRouter con modelo gratuito configurable y fallback local auditable.
- Registro de fuentes de aprendizaje: libros, videos, cursos, manuales, mentores o bitacoras.
- Preguntas diagnosticas contextuales para evaluar explicacion, transferencia y razonamiento propio.
- Carga de archivos de soporte en PDF, imagen o texto, con almacenamiento local y hash SHA-256.
- Evaluacion IA/fallback con rubrica, score, estado, banderas de riesgo y hash.
- Prevencion basica de trampa: el autor no puede auditar su propia evidencia.
- Auditoria humana ponderada por reputacion.
- Mapa visual de habilidades en forma de grafo.
- Busqueda de perfiles por nombre o competencia.
- Areas de practica para agrupar evidencias y revisores.
- Estadisticas integradas de usuarios, evidencias, fuentes IA, revision humana, tendencias y consenso ponderado.
- Exportacion JSON del perfil competencial.
- Credenciales simuladas W3C VC con prueba hash SHA-256.
- Jenkins/Docker como soporte de integracion continua.

## Validacion tecnica

```bash
npm test -w server
npm run build
npm run db:migrate
npm run db:seed
```

Las pruebas cubren el calculo de reputacion, asignacion de credenciales y evaluacion fallback de evidencias con rubrica y hash.

## Integracion continua con GitHub Actions

La tercera entrega usa GitHub Actions como herramienta principal de integracion continua. El flujo esta definido en `.github/workflows/ci.yml` y se ejecuta automaticamente ante cada `push` o `pull_request` hacia `main`.

El workflow realiza estos pasos:

1. Descarga el codigo del repositorio.
2. Prepara Node.js 20.
3. Instala dependencias con `npm ci`.
4. Ejecuta pruebas automatizadas con `npm test -w server`.
5. Compila el frontend con `npm run build`.

Documento de evidencia: `docs/Integracion continua entrega final.docx` y version PDF `docs/Integracion continua entrega final.pdf`.

La clave privada de IA no se sube al repositorio. El archivo real `server/.env` esta ignorado por Git; solo se publica `server/.env.example` con variables vacias y valores de demostracion. Si no se configura `OPENROUTER_API_KEY` o `GEMINI_API_KEY`, el backend usa fallback local auditable para permitir la demostracion academica completa.
