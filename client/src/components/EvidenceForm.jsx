import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, BrainCircuit, Send, Check, UploadCloud, Info, HelpCircle, FileText, Globe, Layers, BookOpen, UserCheck, ShieldAlert } from 'lucide-react';
import { api } from '../api/client.js';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Input, Textarea } from './ui/input.jsx';
import { Badge } from './ui/badge.jsx';

const skillAreas = [
  ['general', 'General'],
  ['software', 'Software'],
  ['tecnica', 'Técnica'],
  ['empirica', 'Empírica'],
  ['creativa', 'Creativa'],
  ['cultural', 'Cultural'],
  ['recreativa', 'Recreativa']
];

const evidenceTypes = [
  ['experiencia', 'Experiencia Laboral / Práctica'],
  ['proyecto', 'Proyecto Personal'],
  ['oficio', 'Oficio / Labor Manual'],
  ['saber_empirico', 'Saber Empírico / Tradicional'],
  ['certificado', 'Certificación o Diploma'],
  ['portafolio', 'Portafolio de Trabajos']
];

const assessmentModes = [
  ['evidencia_practica', 'Evidencia Práctica (código, fotos, planos, diseños)'],
  ['conocimiento_autonomo', 'Conocimiento Autónomo (investigación, autodidacta)'],
  ['mixta', 'Mixta (ambas modalidades)']
];

const questionBank = {
  software: [
    '¿Qué decisión técnica tomaste y qué alternativa descartaste?',
    '¿Cómo verificaste que tu solución funcionaba?',
    'Si el contexto cambiara, ¿qué parte ajustarías primero?'
  ],
  tecnica: [
    '¿Qué pasos seguiste para reducir riesgos durante la ejecución?',
    '¿Qué herramienta o medición fue decisiva y por qué?',
    '¿Qué falla podría aparecer después y cómo la diagnosticarías?'
  ],
  cultural: [
    '¿Cómo contrastaste la fuente o saber aprendido?',
    '¿Qué límites o riesgos tiene aplicar ese conocimiento?',
    '¿Cómo diferenciarías este saber de una opinión no verificada?'
  ],
  creativa: [
    '¿Qué criterio usaste para evaluar la calidad del resultado?',
    '¿Qué técnica aplicaste y qué efecto buscabas?',
    '¿Cómo adaptarías el trabajo a otro encargo o audiencia?'
  ],
  empirica: [
    '¿Qué aprendiste por repetición, observación o corrección?',
    '¿Qué error común evitaste y cómo lo detectaste?',
    '¿Qué evidencia demuestra que puedes repetir el proceso?'
  ],
  recreativa: [
    '¿Qué regla, principio o procedimiento seguiste?',
    '¿Qué límite de seguridad o alcance tuviste en cuenta?',
    '¿Cómo demostrarías que no fue un resultado accidental?'
  ],
  general: [
    '¿Qué concepto central aprendiste y cómo lo explicarías con tus palabras?',
    '¿Qué hiciste para comprobar que no solo memorizaste?',
    '¿Cómo aplicarías esto en un caso distinto?'
  ]
};

const emptyForm = {
  title: '',
  body: '',
  skillArea: 'general',
  evidenceType: 'experiencia',
  assessmentMode: 'evidencia_practica',
  learningSources: '',
  challengeAnswers: '',
  artifactUrl: '',
  file: null,
  communityId: ''
};

export function EvidenceForm({ onCreated }) {
  const [communities, setCommunities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState('');
  const [showTooltip, setShowTooltip] = useState(null);

  const questions = useMemo(() => questionBank[form.skillArea] ?? questionBank.general, [form.skillArea]);

  useEffect(() => {
    api.communities().then(setCommunities).catch(() => setCommunities([]));
  }, []);

  // Limpiar vista previa de imagen en desmontaje
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar los 5 MB.');
      return;
    }
    setError('');
    setForm(prev => ({ ...prev, file }));

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = (e) => {
    e.preventDefault();
    setForm(prev => ({ ...prev, file: null }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.createEvidence({
        title: form.title,
        body: form.body,
        skillArea: form.skillArea,
        evidenceType: form.evidenceType,
        assessmentMode: form.assessmentMode,
        learningSources: form.learningSources,
        challengeAnswers: form.challengeAnswers,
        artifactUrl: form.artifactUrl,
        ...(await filePayload(form.file)),
        communityId: form.communityId ? Number(form.communityId) : null
      });
      setForm(emptyForm);
      setStarted(false);
      setStep(1);
      setPreviewUrl('');
      onCreated?.();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  // Comprobar la validez de los pasos para habilitar "Siguiente"
  const isStepValid = useMemo(() => {
    if (step === 1) return form.title.trim().length > 2;
    if (step === 2) return form.learningSources.trim().length > 10;
    if (step === 3) return form.body.trim().length > 15;
    if (step === 4) return form.challengeAnswers.trim().length > 10;
    return true;
  }, [step, form.title, form.learningSources, form.body, form.challengeAnswers]);

  if (!started) {
    return (
      <Card className="overflow-hidden border border-violet-100 dark:border-violet-950/40">
        <div className="h-2 bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-600" />
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3.5 bg-violet-50 dark:bg-violet-950/50 rounded-2xl text-violet-600 dark:text-violet-400">
              <BrainCircuit size={32} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-black">Evaluación de Habilidades con IA</CardTitle>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400 max-w-sm">
                Inicia una evaluación guiada. HabiliTrace revisa tu evidencia, fuentes de aprendizaje y respuestas al reto antes de emitir un puntaje competencial auditado.
              </p>
            </div>
            <Button 
              onClick={() => setStarted(true)} 
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold h-12 shadow-lg shadow-violet-500/25 dark:shadow-none transition-all duration-300 rounded-xl"
            >
              <BrainCircuit size={18} />
              Empezar evaluación de habilidad
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-violet-100 dark:border-violet-950/40">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80 p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit size={20} className="text-violet-500" />
              <CardTitle className="text-base font-black">Registro de Habilidad</CardTitle>
            </div>
            <Badge variant="default" className="bg-violet-600 hover:bg-violet-600 text-white dark:bg-violet-500 dark:text-slate-950">
              Paso {step} de 4
            </Badge>
          </div>

          {/* Stepper Visual */}
          <div className="relative flex items-center justify-between w-full mt-4">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-violet-500 -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />

            {[
              { num: 1, label: 'Habilidad', icon: Layers },
              { num: 2, label: 'Fuentes', icon: BookOpen },
              { num: 3, label: 'Evidencia', icon: FileText },
              { num: 4, label: 'Revisión', icon: UserCheck }
            ].map((s) => {
              const StepIcon = s.icon;
              const isCompleted = step > s.num;
              const isActive = step === s.num;

              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.num < step || (s.num > step && isStepValid)) {
                        setStep(s.num);
                      }
                    }}
                    className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : isActive 
                        ? 'bg-violet-600 text-white ring-4 ring-violet-100 dark:ring-violet-950' 
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : s.num}
                  </button>
                  <span className={`mt-1.5 hidden md:block text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={submit} className="space-y-5">
          
          {/* PASO 1: HABILIDAD */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Nombre de la Habilidad
                  <HelpButton id="title" text="Describe puntualmente la habilidad técnica o conocimiento que deseas evaluar, por ejemplo: 'Desarrollo backend con Node.js' o 'Instalación de paneles solares'." showTooltip={showTooltip} setShowTooltip={setShowTooltip} />
                </label>
                <Input 
                  value={form.title} 
                  onChange={(event) => setForm({ ...form, title: event.target.value })} 
                  placeholder="Ej. Diseño de interfaces UI con Figma" 
                  required 
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Área de Competencia</label>
                  <Select value={form.skillArea} onChange={(value) => setForm({ ...form, skillArea: value })} options={skillAreas} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Origen de la Evidencia</label>
                  <Select value={form.evidenceType} onChange={(value) => setForm({ ...form, evidenceType: value })} options={evidenceTypes} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Modalidad de Evaluación</label>
                <Select value={form.assessmentMode} onChange={(value) => setForm({ ...form, assessmentMode: value })} options={assessmentModes} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Área de Práctica (Comunidad)
                  <span className="text-[10px] lowercase font-normal text-slate-400">(opcional)</span>
                </label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-violet-950/50 text-slate-700 dark:text-slate-300"
                  value={form.communityId}
                  onChange={(event) => setForm({ ...form, communityId: event.target.value })}
                >
                  <option value="">Sin área de práctica asociada</option>
                  {communities.map((community) => (
                    <option value={community.id} key={community.id}>
                      {community.name} ({community.area})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStarted(false)}>
                  <ArrowLeft size={16} />
                  Cancelar
                </Button>
                <Button type="button" className="flex-1" onClick={() => setStep(2)} disabled={!isStepValid}>
                  Continuar
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2: FUENTES DE APRENDIZAJE */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Fuentes de Conocimiento y Aprendizaje
                  <HelpButton id="sources" text="Listar los libros, cursos en línea, mentores, documentación oficial, horas de práctica o bitácoras que fundamentan lo que sabes." showTooltip={showTooltip} setShowTooltip={setShowTooltip} />
                </label>
                <Textarea
                  value={form.learningSources}
                  onChange={(event) => setForm({ ...form, learningSources: event.target.value })}
                  placeholder="Ej. Curso Profesional de React de Midudev en YouTube (40 horas), Documentación oficial de React Docs (secciones Hooks y Performance), y 6 meses construyendo proyectos personales en mi repositorio."
                  required
                />
                <p className="flex items-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  <span>Detallar tus fuentes ayuda a contrastar la idoneidad técnica de tu autoaprendizaje.</span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} />
                  Atrás
                </Button>
                <Button type="button" className="flex-1" onClick={() => setStep(3)} disabled={!isStepValid}>
                  Continuar
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 3: EVIDENCIA Y ARCHIVO */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Descripción Detallada del Proceso o Caso
                  <HelpButton id="body" text="Explica detalladamente qué hiciste, el contexto del problema, las herramientas utilizadas, cómo resolviste el reto y cuál fue el resultado verificable." showTooltip={showTooltip} setShowTooltip={setShowTooltip} />
                </label>
                <Textarea
                  value={form.body}
                  onChange={(event) => setForm({ ...form, body: event.target.value })}
                  placeholder="Describe detalladamente el contexto del reto, qué herramientas empleaste, qué proceso técnico ejecutaste para resolverlo y cómo verificaste el resultado final..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Enlace Web (URL)
                  <span className="text-[10px] lowercase font-normal text-slate-400">(opcional)</span>
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-3 text-slate-400" />
                  <Input
                    value={form.artifactUrl}
                    onChange={(event) => setForm({ ...form, artifactUrl: event.target.value })}
                    placeholder="https://github.com/usuario/repositorio"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Drag and Drop File Uploader */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Archivo de Soporte
                  <span className="text-[10px] lowercase font-normal text-slate-400">(opcional)</span>
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20' 
                      : 'border-slate-300 bg-slate-50/40 hover:border-violet-400 dark:border-slate-800 dark:bg-slate-900/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,image/png,image/jpeg,image/webp,text/plain,text/markdown"
                    onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                    className="hidden"
                  />

                  {form.file ? (
                    <div className="space-y-3 w-full" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Vista previa" className="h-16 w-16 object-cover rounded-lg shadow border border-slate-200 dark:border-slate-800" />
                        ) : (
                          <FileText size={32} />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-xs mx-auto">
                          {form.file.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(form.file.size / (1024 * 1024)).toFixed(2)} MB · {form.file.type.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                        </p>
                      </div>
                      <button
                        onClick={removeFile}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Quitar archivo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud size={32} className="mx-auto text-slate-400 dark:text-slate-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Arrastra tu archivo aquí o haz clic para buscar
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PDF, Imágenes (PNG, JPG, WEBP) o Texto hasta 5 MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2"><ShieldAlert size={14} /> {error}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} />
                  Atrás
                </Button>
                <Button type="button" className="flex-1" onClick={() => setStep(4)} disabled={!isStepValid}>
                  Continuar
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 4: REVISIÓN Y ENVÍO */}
          {step === 4 && (
            <div className="space-y-5">
              
              {/* Preguntas Diagnósticas */}
              <div className="rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100/50 dark:border-violet-900/30 p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <BrainCircuit className="text-violet-600 dark:text-violet-400" size={18} />
                  <p className="text-xs font-black uppercase text-violet-700 dark:text-violet-300">Preguntas Diagnósticas del Área ({form.skillArea.toUpperCase()})</p>
                </div>
                <ol className="list-decimal gap-2 pl-4 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                  {questions.map((question, i) => (
                    <li key={question} className="mb-1">
                      {question}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  Respuestas de Autodiagnóstico
                  <HelpButton id="answers" text="Responde las preguntas anteriores con tus propias palabras. Explica detalladamente el por qué de tus decisiones, los errores comunes que previste y cómo te asegurarías de repetir el proceso satisfactoriamente." showTooltip={showTooltip} setShowTooltip={setShowTooltip} />
                </label>
                <Textarea
                  value={form.challengeAnswers}
                  onChange={(event) => setForm({ ...form, challengeAnswers: event.target.value })}
                  placeholder="1. Descarté la alternativa X porque... 2. Verifiqué el funcionamiento ejecutando... 3. Si cambiara de contexto, primero modificaría..."
                  required
                />
              </div>

              {/* Resumen Final de Revisión */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-white/40 dark:bg-slate-900/30">
                <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Info size={14} /> Resumen de envío
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Habilidad: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">{form.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Área: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block capitalize">{form.skillArea}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tipo: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">
                      {evidenceTypes.find(opt => opt[0] === form.evidenceType)?.[1].split(' ')[0] || form.evidenceType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Archivo: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">
                      {form.file ? form.file.name : 'Ninguno'}
                    </span>
                  </div>
                </div>
              </div>

              {error && <p className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2"><ShieldAlert size={14} /> {error}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(3)}>
                  <ArrowLeft size={16} />
                  Atrás
                </Button>
                <Button disabled={loading || !isStepValid} className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold">
                  <Send size={16} />
                  {loading ? 'Evaluando con IA...' : 'Enviar evaluación'}
                </Button>
              </div>
            </div>
          )}

        </form>
      </CardContent>
    </Card>
  );
}

function filePayload(file) {
  if (!file) return {};
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('El archivo no puede superar 5 MB.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileDataBase64: String(reader.result)
      });
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });
}

function Select({ value, onChange, options }) {
  return (
    <select
      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-violet-950/50 text-slate-700 dark:text-slate-300"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map(([optionValue, label]) => <option value={optionValue} key={optionValue}>{label}</option>)}
    </select>
  );
}

function HelpButton({ id, text, showTooltip, setShowTooltip }) {
  const isShown = showTooltip === id;
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(id)}
        onMouseLeave={() => setShowTooltip(null)}
        onClick={() => setShowTooltip(isShown ? null : id)}
        className="text-slate-400 hover:text-violet-500 transition-colors focus:outline-none cursor-help"
        aria-label="Ayuda"
      >
        <HelpCircle size={14} />
      </button>
      {isShown && (
        <span className="absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-lg bg-slate-900 p-3.5 text-[11px] font-medium normal-case leading-relaxed text-white shadow-xl dark:bg-slate-800 border border-slate-800 dark:border-slate-700">
          {text}
          <span className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900 dark:bg-slate-800" />
        </span>
      )}
    </span>
  );
}
