# Instructivo de Entrega Final - HabiliTrace

Fecha de trabajo sugerida: lunes 22 de junio de 2026  
Entrega objetivo: martes 23 de junio de 2026

## 1. Que es HabiliTrace en una frase

HabiliTrace es una aplicacion web prototipo para evaluar habilidades reales adquiridas en contextos formales, informales o autonomos, usando evidencias, fuentes de aprendizaje, preguntas diagnosticas, una rubrica asistida por IA y revision humana cuando la decision no debe depender solo del modelo.

No es una red social. No es solo una pagina web. No es una app movil nativa.

Es una aplicacion web con:

- Frontend: interfaz en React.
- Backend: API REST en Node.js/Express.
- Base de datos: SQLite.
- Modulo IA: OpenRouter si hay clave, Gemini como alternativa, fallback local si no hay clave o falla el proveedor.
- Evidencias: texto, URL y archivo local con hash SHA-256.
- Validacion: rubrica automatica + revision humana cuando hay riesgo o baja confianza.

## 2. Problema que resuelve

Muchas personas tienen habilidades reales que no siempre estan representadas por un titulo formal: soldadores, electricistas, zapateros, artesanos, programadores autodidactas, conocedores de plantas medicinales, pintores, musicos empiricos, hablantes de lenguas poco documentadas, etc.

El problema no es solamente guardar certificados. El problema es transformar una experiencia, una practica o un aprendizaje autonomo en una competencia evaluable, trazable y visible.

HabiliTrace responde asi:

1. El usuario inicia una evaluacion de habilidad.
2. Declara area, tipo de habilidad y modo de evaluacion.
3. Describe que sabe hacer.
4. Registra fuentes de aprendizaje: libros, videos, cursos, manuales, bitacoras o mentores.
5. Adjunta evidencia: archivo, URL, repositorio, foto, PDF, video o documento.
6. Responde preguntas diagnosticas contextualizadas.
7. El sistema evalua con rubrica.
8. La evidencia queda prevalidada, insuficiente o pendiente de revision humana.
9. El mapa de habilidades y el perfil competencial se actualizan.

## 3. Conceptos que debes entender para sustentar

### Frontend

Es la parte visual de la aplicacion. Es lo que abre el usuario en:

```bash
http://localhost:5173
```

Aqui estan el panel, el formulario de evaluacion, el mapa de habilidades, perfiles y evidencias.

### Backend

Es el servidor que procesa datos, autentica usuarios, guarda evidencias, ejecuta la evaluacion y responde al frontend.

Corre en:

```bash
http://localhost:4000/api
```

### API

La API no es una pagina visual. Es un conjunto de rutas que responden JSON.

Por eso antes salia `Cannot GET /api`: no habia una ruta de bienvenida.

Ahora `GET /api` responde informacion util:

```bash
http://localhost:4000/api
```

### Swagger

Swagger es una pagina para probar la API sin escribir codigo.

URL:

```bash
http://localhost:4000/api/docs
```

Como usarlo:

1. Abrir Swagger.
2. Buscar `POST /auth/login`.
3. Probar con:

```json
{
  "email": "ana@example.com",
  "password": "password123"
}
```

4. Copiar el `token`.
5. Dar clic en `Authorize`.
6. Pegar solo el token JWT. Swagger agrega `Bearer` automaticamente.

7. Probar endpoints protegidos como `POST /evidences`.

### IA real y fallback

HabiliTrace usa modo `auto`:

- Con clave `OPENROUTER_API_KEY`: usa OpenRouter, por defecto con `OPENROUTER_MODEL="openrouter/free"`.
- Si no hay OpenRouter pero existe `GEMINI_API_KEY`: usa Gemini.
- Sin clave o si el proveedor falla: usa fallback local con reglas, rubrica, score y hash.

Esto es importante: el prototipo funciona aunque no tengas una API de pago.

Para conectar OpenRouter:

```bash
cp server/.env.example server/.env
```

Editar `server/.env`:

```env
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="openrouter/free"
```

Luego:

```bash
npm run dev
```

## 4. Como correr el proyecto

Desde la carpeta:

```bash
/Users/johnvanegas/Downloads/Trabajo de Grado/HabiliTrace/Project
```

Ejecutar:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

URLs:

```bash
Frontend: http://localhost:5173
API:      http://localhost:4000/api
Swagger:  http://localhost:4000/api/docs
```

Usuarios de prueba:

```text
ana@example.com / password123
luis@example.com / password123
sofia@example.com / password123
```

## 5. Como validar que todo funciona

Antes de tocar documento o sustentar, ejecutar:

```bash
npm run db:migrate
npm run db:seed
npm test -w server
npm run build
```

Resultado esperado:

- Migracion: `SQLite schema ready.`
- Seed: `Demo data inserted.`
- Tests: `pass 6`
- Build: `built`

## 6. Que debe ver el profesor en 60 segundos

La demo debe mostrar este flujo:

1. Login en HabiliTrace.
2. Panel de evaluacion competencial.
3. Clic en `Empezar evaluacion de habilidad`.
4. Elegir un caso: por ejemplo conocimiento autonomo o habilidad tecnica.
5. Agregar fuentes de aprendizaje.
6. Adjuntar un archivo o URL.
7. Responder preguntas diagnosticas.
8. Enviar evaluacion.
9. Mostrar tarjeta con:
   - score IA,
   - rubrica,
   - competencias detectadas,
   - hash,
   - banderas de riesgo,
   - estado de revision.
10. Mostrar mapa de habilidades actualizado.

Frase para decir en sustentacion:

> El sistema no certifica automaticamente a una persona solo porque diga que sabe algo. Primero exige una reclamacion de habilidad, fuentes de aprendizaje, evidencia o soporte, respuestas diagnosticas y una evaluacion por rubrica. Si hay riesgo, baja trazabilidad o conocimiento sensible, la decision queda para revision humana.

## 7. Como explicar la evaluacion de conocimiento autonomo

Problema:

Una persona puede decir que aprendio sola por libros o videos, pero eso no prueba competencia.

Solucion de HabiliTrace:

No evalua simplemente que alguien vio videos. Evalua si puede:

- declarar fuentes concretas,
- explicar con sus palabras,
- aplicar el conocimiento a un caso,
- reconocer errores o riesgos,
- adjuntar una evidencia,
- defender decisiones frente a preguntas diagnosticas.

Ejemplo:

No basta:

```text
Vi videos de electricidad y ya se.
```

Mejor:

```text
Estudie un manual de electricidad residencial, practique mediciones en entorno controlado, documente lecturas con multimetro y explique que haria si una medicion no coincide.
```

## 8. Rubrica actual

La evaluacion usa estos criterios:

- Pertinencia: la evidencia corresponde a la habilidad declarada.
- Claridad: la descripcion se entiende.
- Suficiencia: hay datos suficientes para evaluar.
- Complejidad: la tarea muestra dificultad real.
- Coherencia tecnica: el proceso tiene sentido.
- Trazabilidad: hay soporte, archivo, URL, bitacora o hash.
- Dominio conceptual: entiende fundamentos, no solo repite.
- Transferencia: puede aplicar el conocimiento a otro caso.

Estados:

- `prevalidated_ai`: evidencia fuerte y sin riesgo alto.
- `needs_human_review`: requiere revision humana.
- `insufficient`: evidencia insuficiente.

## 9. Que falta mejorar manana

Prioridad alta para lunes 22 de junio:

### A. Frontend del modulo de evaluacion

Mejorar apariencia del flujo guiado:

- Que parezca evaluacion profesional por pasos.
- Agregar indicador visual de progreso.
- Separar mejor:
  - datos de habilidad,
  - fuentes,
  - evidencia,
  - preguntas diagnosticas.
- Agregar textos cortos de ayuda.

No convertirlo en landing page.

### B. Evidencias para el documento final

Preparar evidencias de funcionamiento:

- Login.
- Panel de evaluacion.
- Formulario guiado paso 1.
- Formulario guiado paso 2.
- Evidencia evaluada con rubrica.
- Mapa de habilidades.
- Swagger abierto.
- Respuesta JSON de `/api/evidences`.
- Credencial JSON con hash.

Guardar en:

```bash
docs/evidencias_finales/
```

### C. Integracion LLM real

Si consigues clave OpenRouter:

1. Crear/editar `server/.env`.
2. Poner `OPENROUTER_API_KEY`.
3. Probar una evidencia nueva.
4. Guardar evidencia técnica interna donde `source` sea `openrouter` y `providerModel` muestre el modelo usado.

Si no consigues clave:

Defender fallback local como evaluador auditable y reproducible.

Frase:

> Para garantizar funcionamiento en demo y pruebas locales, el sistema tiene un fallback deterministico. La arquitectura permite usar OpenRouter o Gemini mediante variables de entorno sin cambiar el flujo de evidencias.

### D. Documento final

Actualizar el capitulo de resultados con:

- Arquitectura real.
- Modulo de evaluacion.
- Rubrica.
- Evidencias de funcionamiento.
- JSON.
- Pruebas.
- Limitaciones.
- Trabajo futuro.

No decir que es producto final comercial. Decir que es prototipo funcional validable.

## 10. Plan de trabajo recomendado

### Lunes 22 de junio - manana

Bloque 1: 8:00 a. m. - 10:00 a. m.

- Correr proyecto.
- Revisar flujo completo.
- Corregir errores visibles del frontend.

Bloque 2: 10:00 a. m. - 1:00 p. m.

- Pulir modulo de evaluacion.
- Mejorar textos, botones, estados y carga de archivo.
- Validar responsive.

Bloque 3: 2:00 p. m. - 5:00 p. m.

- Generar evidencias visuales.
- Exportar JSON.
- Probar Swagger.
- Guardar evidencias de funcionamiento.

Bloque 4: 6:00 p. m. - 10:00 p. m.

- Integrar evidencias en documento final.
- Escribir capitulo de resultados obtenidos.
- Escribir limitaciones y trabajo futuro.

### Martes 23 de junio

- Releer documento.
- Verificar que el proyecto corre.
- Tener evidencias listas.
- Preparar demo de 8 a 12 minutos.
- No hacer cambios grandes de codigo salvo errores criticos.

## 11. Guion breve de sustentacion

1. Problema:

> Muchas habilidades reales no quedan representadas por titulos formales.

2. Propuesta:

> HabiliTrace permite registrar y evaluar competencias mediante evidencias, fuentes, preguntas diagnosticas, IA y revision humana.

3. Arquitectura:

> Frontend React, API Express, SQLite, modulo IA/fallback, Swagger y credenciales con hash SHA-256.

4. Presentacion funcional:

> Muestro una evidencia, la evaluacion, la rubrica, el mapa de habilidades y la trazabilidad.

5. Resultado:

> El prototipo demuestra que es posible transformar aprendizaje formal, informal o autonomo en un perfil competencial verificable.

6. Limitacion:

> La IA no certifica sola. Para habilidades de riesgo o baja trazabilidad se requiere revision humana.

7. Futuro:

> Integrar modelos LLM en produccion, almacenamiento descentralizado, validadores expertos y credenciales verificables completas.

## 12. Lista de chequeo final

Antes de entregar:

- [ ] `npm test -w server` pasa.
- [ ] `npm run build` pasa.
- [ ] `npm run db:migrate` pasa.
- [ ] `npm run db:seed` pasa.
- [ ] Frontend abre en `localhost:5173`.
- [ ] API abre en `localhost:4000/api`.
- [ ] Swagger abre en `localhost:4000/api/docs`.
- [ ] Login demo funciona.
- [ ] Se puede crear evidencia.
- [ ] Se puede subir archivo.
- [ ] Sale rubrica y score.
- [ ] Sale hash.
- [ ] Mapa de habilidades muestra datos.
- [ ] Documento final incluye evidencias de funcionamiento.
- [ ] Presentacion explica problema, arquitectura, demo y resultados.

## 13. Respuesta a preguntas dificiles del jurado

### La IA puede equivocarse. Que hacen?

La IA no emite certificacion definitiva. Produce una evaluacion preliminar con rubrica y nivel de confianza. Si hay riesgo, baja trazabilidad o ambiguedad, la evidencia pasa a revision humana.

### Como evitan que alguien use otra IA para responder?

No se evita al 100% en un prototipo. Se mitiga exigiendo evidencia contextual, archivo, hash, fuentes concretas, respuestas de transferencia y revision humana. A futuro se pueden agregar entrevistas sincronas, pruebas practicas, deteccion de similitud y validadores expertos.

### Por que no basta con preguntas?

Porque responder preguntas puede medir memoria o ayuda externa. HabiliTrace combina preguntas con evidencia, fuentes, trazabilidad, aplicacion y revision.

### Que pasa si alguien aprendio solo?

Se evalua como conocimiento autonomo. Debe registrar ruta de aprendizaje, fuentes, defensa diagnostica y evidencia minima. El sistema evalua dominio conceptual y transferencia.

### Esto ya certifica oficialmente?

No. Es un prototipo funcional academico. Emite credenciales simuladas con hash y deja preparada la arquitectura para credenciales verificables reales.
