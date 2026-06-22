import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Clock3, FileWarning, Headset, Send, ShieldCheck } from 'lucide-react';
import { api } from '../api/client.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Input, Textarea } from '../components/ui/input.jsx';

const requestTypes = [
  ['appeal', 'Apelar evaluación'],
  ['validation_help', 'Ayuda con validación'],
  ['technical', 'Soporte técnico'],
  ['general', 'Consulta general']
];

export function SupportPage() {
  const [params] = useSearchParams();
  const initialEvidenceId = params.get('evidenceId') ?? '';
  const [evidences, setEvidences] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    type: 'appeal',
    evidenceId: initialEvidenceId,
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    const [feed, nextRequests] = await Promise.all([api.feed(), api.supportRequests()]);
    setEvidences(feed.filter((item) => item.author?.id === JSON.parse(localStorage.getItem('skillcert_user') || '{}')?.id));
    setRequests(nextRequests);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const selectedEvidence = useMemo(
    () => evidences.find((evidence) => String(evidence.id) === String(form.evidenceId)),
    [evidences, form.evidenceId]
  );

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const payload = await api.createSupportRequest({
        type: form.type,
        evidenceId: form.evidenceId ? Number(form.evidenceId) : null,
        subject: form.subject,
        message: form.message
      });
      setNotice(payload.standardResponse);
      setForm({ type: 'appeal', evidenceId: '', subject: '', message: '' });
      await refresh();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl items-start gap-8 px-6 py-8 lg:grid-cols-[420px_1fr]">
      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Soporte y apelaciones</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Acompañamiento de validación
          </h1>
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            Todo usuario puede pedir ayuda, solicitar revisión de una auditoría o apelar una evaluación cuando considere que faltó contexto.
          </p>
        </div>

        <Card className="border border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/70">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-violet-50 p-2 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h2 className="font-display text-base font-black text-slate-900 dark:text-white">Derecho a revisión</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Las decisiones asistidas por IA y auditoría humana deben poder revisarse. La respuesta inicial queda comprometida dentro de 48 horas hábiles.
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="grid gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo de solicitud</label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-950"
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                >
                  {requestTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Evidencia relacionada</label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-slate-800 dark:bg-slate-950"
                  value={form.evidenceId}
                  onChange={(event) => setForm({ ...form, evidenceId: event.target.value })}
                >
                  <option value="">No asociar evidencia específica</option>
                  {evidences.map((evidence) => (
                    <option value={evidence.id} key={evidence.id}>
                      #{evidence.id} · {evidence.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEvidence && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  Estado actual: <strong>{statusLabel(selectedEvidence.status)}</strong>. Puntaje: <strong>{selectedEvidence.evaluation?.overallScore ?? '--'}</strong>.
                </div>
              )}

              <Input
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
                placeholder="Asunto de la solicitud"
                required
              />
              <Textarea
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                placeholder="Describe qué necesitas revisar, qué contexto falta o por qué solicitas una apelación..."
                required
              />

              {notice && (
                <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {notice}
                </p>
              )}
              {error && (
                <p className="rounded-lg bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                  {error}
                </p>
              )}

              <Button disabled={loading} className="h-11">
                <Send size={16} />
                {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <Card className="border border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/70">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <PolicyItem icon={<Clock3 size={18} />} title="48 h hábiles" text="Respuesta inicial para apelaciones y acompañamiento de validación." />
            <PolicyItem icon={<FileWarning size={18} />} title="Evidencia trazable" text="Se revisan rubrica, soporte, hash, comentarios y votos asociados." />
            <PolicyItem icon={<AlertCircle size={18} />} title="Derecho a contexto" text="Puedes explicar información que no haya quedado clara en la evaluación inicial." />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="font-display flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <Headset size={20} className="text-violet-600" />
            Mis solicitudes
          </h2>
          {requests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-800">
              Aún no has enviado solicitudes de soporte o apelación.
            </p>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card className="border border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/70" key={request.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">
                          {typeLabel(request.type)}
                        </p>
                        <h3 className="font-display text-lg font-black text-slate-900 dark:text-white">{request.subject}</h3>
                      </div>
                      <Badge variant={request.status === 'open' ? 'gold' : 'green'}>{request.status === 'open' ? 'Abierta' : 'Cerrada'}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{request.message}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      {request.evidence && <Badge variant="secondary">Evidencia #{request.evidence.id}</Badge>}
                      <span>Respuesta estimada: {formatDate(request.responseDueAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function PolicyItem({ icon, title, text }) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <span className="inline-flex rounded-lg bg-violet-50 p-2 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">{icon}</span>
      <h3 className="font-display text-sm font-black text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    prevalidated_ai: 'Prevalidada',
    needs_human_review: 'Requiere revisión',
    insufficient: 'Insuficiente'
  };
  return labels[status] ?? 'Abierta';
}

function typeLabel(type) {
  return requestTypes.find(([value]) => value === type)?.[1] ?? 'Solicitud';
}

function formatDate(value) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
