import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  FileCheck2,
  Scale,
  ShieldCheck,
  TrendingUp,
  UsersRound
} from 'lucide-react';
import { api } from '../api/client.js';
import { EvidenceCard } from '../components/EvidenceCard.jsx';
import { EvidenceForm } from '../components/EvidenceForm.jsx';
import { SkillMap } from '../components/SkillMap.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { useAuth } from '../hooks/useAuth.js';

export function DashboardPage() {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);

  async function refresh() {
    const [nextFeed, nextTrends, nextStats, nextAiStatus] = await Promise.all([
      api.feed(),
      api.trends(),
      api.stats(),
      api.aiStatus()
    ]);
    setFeed(nextFeed);
    setTrends(nextTrends);
    setStats(nextStats);
    setAiStatus(nextAiStatus);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const metrics = useMemo(() => {
    const evaluated = feed.filter((item) => item.evaluation);
    const feedAverage = evaluated.length
      ? Math.round(evaluated.reduce((sum, item) => sum + item.evaluation.overallScore, 0) / evaluated.length)
      : 0;

    return {
      total: stats?.totals?.evidences ?? feed.length,
      users: stats?.totals?.users ?? 0,
      avg: stats?.evaluations?.averageScore ?? feedAverage,
      prevalidated: stats?.evaluations?.prevalidated ?? feed.filter((item) => item.status === 'prevalidated_ai').length,
      review: stats?.evaluations?.needsHumanReview ?? feed.filter((item) => item.status === 'needs_human_review').length,
      reviewRate: stats?.evaluations?.reviewRate ?? 0,
      confirmations: stats?.votes?.confirmations ?? 0,
      objections: stats?.votes?.objections ?? 0
    };
  }, [feed, stats]);

  const ai = aiStatus ?? stats?.ai;
  const topCompetences = stats?.topCompetences?.length
    ? stats.topCompetences.map((item) => ({
        name: item.name,
        validationScore: `${item.evidenceCount} evid.`
      }))
    : trends;

  return (
    <main className="mx-auto grid max-w-7xl items-start gap-8 px-6 py-8 xl:grid-cols-[460px_1fr]">
      <section className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Panel Principal</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Evaluacion competencial
          </h1>
          <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Flujo completo para evidencias, preevaluacion IA, revision humana ponderada, mapa de habilidades y credenciales.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Metric
            icon={<FileCheck2 size={18} />}
            label="Evidencias"
            value={metrics.total}
            colorClass="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
          />
          <Metric
            icon={<BrainCircuit size={18} />}
            label="Promedio IA"
            value={metrics.avg || '--'}
            colorClass="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
          />
          <Metric
            icon={<CheckCircle2 size={18} />}
            label="Prevalidadas"
            value={metrics.prevalidated}
            colorClass="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          />
          <Metric
            icon={<AlertTriangle size={18} />}
            label="A revision"
            value={metrics.review}
            colorClass="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          />
        </div>

        <EvaluationGovernancePanel ai={ai} stats={stats} />
        <EvidenceForm onCreated={refresh} />
        <SkillMap userId={user.id} />

        <Card className="border border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base font-black text-slate-800 dark:text-white">
              <TrendingUp size={18} className="text-violet-500" />
              Competencias detectadas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {topCompetences.length === 0 && <p className="text-xs text-slate-500">Sin tendencias aun.</p>}
            {topCompetences.map((trend) => (
              <Badge variant="blue" key={trend.name} className="px-2.5 py-1">
                {trend.name} · {trend.validationScore}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-2 border-b border-slate-200/60 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Bandeja de Evidencias</p>
            <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white">Historial de validaciones</h2>
          </div>
          <Badge variant="secondary" className="self-start font-semibold sm:self-center">
            <Scale size={13} />
            IA + revision humana ponderada
          </Badge>
        </div>

        <ReviewWorkflowPanel stats={stats} metrics={metrics} />

        <div className="space-y-4">
          {feed.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/40 p-8 text-center dark:border-slate-800 dark:bg-slate-900/20">
              <p className="text-sm text-slate-500">No hay evidencias registradas en tu red para mostrar.</p>
            </div>
          )}
          {feed.map((evidence) => (
            <EvidenceCard evidence={evidence} onChanged={refresh} key={evidence.id} />
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ icon, label, value, colorClass }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span className={`shrink-0 rounded-lg p-1.5 ${colorClass}`}>{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display mt-3 text-3xl font-black leading-none text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function EvaluationGovernancePanel({ ai, stats }) {
  return (
    <Card className="border border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/70">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
              <ShieldCheck size={15} />
              Gobierno de evaluacion
            </p>
            <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">IA asistida + control humano</h2>
          </div>
          <Badge variant="green">Activo</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoLine label="Motor interno" value={ai?.mode === 'external_model' ? 'Configurado' : 'Modo local auditable'} />
          <InfoLine label="Continuidad" value={ai?.fallbackAvailable ? 'Fallback disponible' : 'Verificacion manual'} />
          <InfoLine label="Usuarios activos" value={stats?.totals?.users ?? '--'} />
          <InfoLine label="Revision requerida" value={`${stats?.evaluations?.reviewRate ?? 0}%`} />
        </div>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          La configuracion tecnica del modelo queda reservada para administracion. En la interfaz publica se muestra el flujo:
          preevaluacion asistida, trazabilidad, riesgo y validacion humana ponderada.
        </p>
      </CardContent>
    </Card>
  );
}

function ReviewWorkflowPanel({ stats, metrics }) {
  const workflow = stats?.humanReview?.workflow ?? [];

  return (
    <Card className="border border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/70">
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
              <ShieldCheck size={15} />
              Revision humana
            </p>
            <h3 className="font-display text-lg font-black text-slate-900 dark:text-white">
              La IA no certifica sola
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat icon={<UsersRound size={14} />} value={metrics.users || '--'} label="usuarios" />
            <MiniStat icon={<CheckCircle2 size={14} />} value={metrics.confirmations} label="conf." />
            <MiniStat icon={<AlertTriangle size={14} />} value={metrics.objections} label="obj." />
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          {stats?.humanReview?.summary ??
            'La comunidad confirma o cuestiona la evidencia despues de la preevaluacion IA, usando votos ponderados por reputacion.'}
        </p>
        {workflow.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {workflow.map((item, index) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300" key={item}>
                <span className="mr-2 font-black text-violet-600 dark:text-violet-400">{index + 1}</span>
                {item}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function MiniStat({ icon, value, label }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400">
        {icon}
        <span className="font-display text-sm font-black text-slate-900 dark:text-white">{value}</span>
      </div>
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
    </div>
  );
}
