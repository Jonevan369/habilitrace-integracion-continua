import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BrainCircuit,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Hash,
  HelpCircle,
  Scale,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  XCircle
} from 'lucide-react';
import { api, API_ORIGIN } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.js';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Card, CardContent } from './ui/card.jsx';

const statusCopy = {
  prevalidated_ai: { label: 'Prevalidada por IA', variant: 'green', icon: CheckCircle2 },
  needs_human_review: { label: 'Requiere revisión', variant: 'gold', icon: AlertTriangle },
  insufficient: { label: 'Insuficiente', variant: 'red', icon: XCircle },
  open: { label: 'Abierta', variant: 'blue', icon: BrainCircuit }
};

const rubricLabels = {
  pertinencia: 'Pertinencia',
  claridad: 'Claridad',
  suficiencia: 'Suficiencia',
  complejidad: 'Complejidad',
  coherenciaTecnica: 'Coherencia Técnica',
  trazabilidad: 'Trazabilidad',
  dominioConceptual: 'Dominio Conceptual',
  transferencia: 'Transferencia'
};

export function EvidenceCard({ evidence, onChanged }) {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const evaluation = evidence.evaluation;
  const status = statusCopy[evidence.status] ?? statusCopy.open;
  const StatusIcon = status.icon;
  const ownEvidence = user?.id === evidence.authorId;
  const artifactHref = resolveArtifactUrl(evidence.artifactUrl);

  // Buscar el voto del usuario actual en la lista de votos
  const userVote = evidence.votes?.find((v) => v.user?.id === user?.id)?.value;

  async function audit(value) {
    setError('');
    try {
      await api.vote(evidence.id, {
        value,
        comment: value === 1 ? 'Revisión humana: evidencia coherente con la rúbrica.' : 'Revisión humana: requiere soporte adicional.'
      });
      onChanged?.();
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  function handleCopyHash() {
    if (!evaluation?.evidenceHash) return;
    navigator.clipboard.writeText(evaluation.evidenceHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="hover:shadow-md transition-all duration-300 bg-white/70 backdrop-blur-sm dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-1">
            <Link to={`/profile/${evidence.author.id}`} className="text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 hover:underline">
              {evidence.author.name}
            </Link>
            <h3 className="text-xl font-black tracking-tight leading-tight text-slate-900 dark:text-white font-display">
              {evidence.title}
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant={status.variant}>
                <StatusIcon size={13} />
                {status.label}
              </Badge>
              <Badge variant="secondary">{areaLabel(evidence.skillArea)}</Badge>
              <Badge variant="blue">{typeLabel(evidence.evidenceType)}</Badge>
              <Badge variant="secondary">{modeLabel(evidence.assessmentMode)}</Badge>
              {evidence.community && <Badge variant="default">{evidence.community.name}</Badge>}
            </div>
          </div>
          
          <div className="flex justify-end shrink-0">
            <CircularScore score={evaluation?.overallScore} />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-900/30">
          {evidence.body}
        </p>

        <div className="flex flex-wrap gap-4 items-center">
          {evidence.artifactUrl && (
            <a
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 hover:underline transition"
              href={artifactHref}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} />
              {evidence.artifactFileName || 'Soporte externo'}
            </a>
          )}

          {evidence.artifactHash && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Archivo: {evidence.artifactFileName} ({formatBytes(evidence.artifactSize)})
            </span>
          )}
        </div>

        {evidence.learningSources && (
          <div className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 border-l-2 border-violet-200 dark:border-violet-900/50 pl-3">
            <strong className="text-slate-700 dark:text-slate-300 font-bold block mb-0.5">Ruta de aprendizaje:</strong>
            {evidence.learningSources}
          </div>
        )}

        <section className="grid gap-4 rounded-xl bg-slate-50/70 p-4 border border-slate-100/50 dark:bg-slate-950/40 dark:border-slate-900/40">
          <div className="flex items-start gap-2.5">
            <BrainCircuit className="text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" size={18} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Análisis Técnico por IA</p>
                {evaluation && <Badge variant="green">Evaluacion asistida</Badge>}
                {evaluation?.humanReviewRequired && (
                  <Badge variant="gold">
                    <ShieldCheck size={12} />
                    Revisión humana
                  </Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mt-1">
                {evaluation?.rationale ?? 'Pendiente de evaluación del modelo.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(evaluation?.rubric ?? {}).map(([key, value]) => (
              <RubricBar key={key} label={rubricLabels[key] ?? key} value={value} />
            ))}
          </div>

          {evidence.suggestions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Habilidades Detectadas:</span>
              {evidence.suggestions.map((skill) => (
                <Badge key={skill.id} variant={skill.level === 'avanzado' ? 'gold' : 'blue'}>
                  {skill.name} · {skill.level} · {Math.round(skill.confidence * 100)}%
                </Badge>
              ))}
            </div>
          )}

          {evaluation?.riskFlags?.length > 0 && (
            <div className="grid gap-1.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
              {evaluation.riskFlags.map((flag) => (
                <p className="flex items-start gap-2 text-xs font-bold text-rose-700 dark:text-rose-400" key={flag}>
                  <AlertTriangle className="shrink-0 text-amber-500 mt-0.5" size={14} />
                  <span>{flag}</span>
                </p>
              ))}
            </div>
          )}

          {evaluation?.evidenceHash && (
            <div className="rounded-lg bg-slate-900 dark:bg-slate-950 p-2.5 flex items-center justify-between gap-3 text-slate-300 font-mono text-[10px] border border-slate-800 dark:border-slate-900/60 shadow-inner">
              <div className="flex items-center gap-1.5 min-w-0">
                <Hash size={12} className="text-violet-400 shrink-0" />
                <span className="truncate">{evaluation.evidenceHash}</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-violet-400 hover:text-violet-300 rounded px-2 py-1 font-sans font-bold cursor-pointer transition shrink-0"
                onClick={handleCopyHash}
              >
                {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          )}
        </section>

        {/* Panel de Validación Colaborativa */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Validación:</span>
            <Badge variant="green" className="py-0.5 px-2">
              <ThumbsUp size={13} />
              {evidence.voteSummary.positive} Confirmaciones
            </Badge>
            <Badge variant="red" className="py-0.5 px-2">
              <ThumbsDown size={13} />
              {evidence.voteSummary.negative} Objeciones
            </Badge>
            <Badge variant="blue" className="py-0.5 px-2 flex items-center">
              <Scale size={13} />
              <span>Peso de Consenso: <strong>{evidence.weightedScore.toFixed(1)}</strong></span>
              <InfoTooltip text="El peso del voto depende directamente de la reputación (karma) acumulada por los validadores en la red." />
            </Badge>
          </div>

          {!ownEvidence ? (
            <div className="flex items-center gap-2">
              <Button 
                variant={userVote === 1 ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => audit(1)}
                className={`h-9 px-3 rounded-lg flex items-center gap-1.5 transition ${
                  userVote === 1 
                    ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400' 
                    : 'hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                }`}
              >
                <CheckCircle2 size={15} />
                <span>Confirmar</span>
              </Button>
              <Button 
                variant={userVote === -1 ? 'destructive' : 'outline'} 
                size="sm" 
                onClick={() => audit(-1)}
                className={`h-9 px-3 rounded-lg flex items-center gap-1.5 transition ${
                  userVote === -1 
                    ? 'bg-rose-600 hover:bg-rose-700 border-rose-600 text-white dark:bg-rose-500 dark:text-slate-950 dark:hover:bg-rose-400' 
                    : 'hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                }`}
              >
                <XCircle size={15} />
                <span>Cuestionar</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="py-1 px-3">Evidencia Propia</Badge>
              <Link
                to={`/support?evidenceId=${evidence.id}`}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Solicitar revisión
              </Link>
            </div>
          )}
        </div>
        {error && <p className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-2.5 text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>}
      </CardContent>
    </Card>
  );
}

function CircularScore({ score }) {
  const parsedScore = typeof score === 'number' ? score : 0;
  const strokeDashoffset = 188.4 - (188.4 * parsedScore) / 100;
  
  const color = parsedScore >= 80 ? 'text-emerald-500' : parsedScore >= 60 ? 'text-amber-500' : parsedScore > 0 ? 'text-rose-500' : 'text-slate-300';
  const trackColor = 'text-slate-100 dark:text-slate-800/80';

  return (
    <div className="relative h-20 w-20 shrink-0 rounded-full border border-slate-100 bg-slate-50/30 p-1 shadow-inner dark:border-slate-800/40 dark:bg-slate-900/30">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r="30"
          stroke="currentColor"
          strokeWidth="5.5"
          fill="transparent"
          className={trackColor}
        />
        <circle
          cx="40"
          cy="40"
          r="30"
          stroke="currentColor"
          strokeWidth="5.5"
          fill="transparent"
          strokeDasharray="188.4"
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-700 ease-out ${color}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-display">
        <div className="flex flex-col items-center justify-center leading-none">
          <span className="text-lg font-black tabular-nums text-slate-800 dark:text-white">
            {score !== undefined ? parsedScore : '--'}
          </span>
          <span className="mt-0.5 text-[7px] font-black uppercase tracking-normal text-slate-400">Puntaje</span>
        </div>
      </div>
    </div>
  );
}

function RubricBar({ label, value }) {
  return (
    <div className="bg-white/40 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-900/30 p-2.5 rounded-lg">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="truncate">{label}</span>
        <span className="font-bold text-slate-700 dark:text-slate-200">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700" 
          style={{ width: `${Math.max(4, Math.min(100, value))}%` }} 
        />
      </div>
    </div>
  );
}

function InfoTooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="text-slate-400 hover:text-violet-500 cursor-help transition-colors p-0.5 focus:outline-none"
      >
        <HelpCircle size={13} />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-lg bg-slate-950 p-2.5 text-[10px] leading-relaxed text-slate-200 shadow-xl border border-slate-800 font-sans font-medium text-center">
          {text}
          <span className="absolute top-full left-1/2 -mt-1 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-slate-950 border-r border-b border-slate-800" />
        </span>
      )}
    </span>
  );
}

function areaLabel(value) {
  const labels = {
    general: 'General',
    software: 'Software',
    tecnica: 'Técnica',
    empirica: 'Empírica',
    creativa: 'Creativa',
    cultural: 'Cultural',
    recreativa: 'Recreativa'
  };
  return labels[value] ?? value;
}

function typeLabel(value) {
  const labels = {
    experiencia: 'Experiencia',
    proyecto: 'Proyecto',
    oficio: 'Oficio',
    saber_empirico: 'Saber empírico',
    certificado: 'Certificado',
    portafolio: 'Portafolio'
  };
  return labels[value] ?? value;
}

function modeLabel(value) {
  const labels = {
    evidencia_practica: 'Práctica',
    conocimiento_autonomo: 'Autónomo',
    mixta: 'Mixta'
  };
  return labels[value] ?? value;
}

function resolveArtifactUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_ORIGIN}${value}`;
}

function formatBytes(value) {
  if (!value) return '0 B';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
