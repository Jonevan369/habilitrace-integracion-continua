import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, Landmark, Search, ShieldCheck, Users2 } from 'lucide-react';
import { api } from '../api/client.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';

export function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [query, setQuery] = useState('');

  async function refresh() {
    setCommunities(await api.communities());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function join(id) {
    await api.joinCommunity(id);
    refresh();
  }

  async function leave(id) {
    await api.leaveCommunity(id);
    refresh();
  }

  const filteredCommunities = useMemo(() => {
    const activeCommunities = communities.filter((community) => community.evidenceCount > 0 || community.memberCount > 1);
    const normalized = query.trim().toLowerCase();
    if (!normalized) return activeCommunities;
    return activeCommunities.filter((community) =>
      `${community.name} ${community.area} ${community.description}`.toLowerCase().includes(normalized)
    );
  }, [communities, query]);
  const joinedCommunities = useMemo(
    () => communities.filter((community) => community.joined && (community.evidenceCount > 0 || community.memberCount > 1)),
    [communities]
  );

  return (
    <main className="mx-auto grid max-w-7xl items-start gap-8 px-6 py-8 lg:grid-cols-[360px_1fr]">
      <section className="space-y-5 lg:sticky lg:top-24">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Áreas del sistema</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Vinculación por práctica
          </h1>
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            Las áreas agrupan evidencias y revisores. En esta versión las define el sistema para mantener criterios estables; los usuarios se vinculan a las que correspondan a su experiencia.
          </p>
        </div>

        <Card className="border border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/70">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-violet-50 p-2 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h2 className="font-display text-base font-black text-slate-900 dark:text-white">Criterio institucional</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Crear áreas libremente puede fragmentar la validación. Por eso el prototipo propone áreas base y permite que cada usuario se vincule, aporte evidencias y revise dentro de su dominio.
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar área, oficio o competencia..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/70">
          <CardContent className="space-y-3 p-5">
            <h2 className="font-display flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Mis áreas vinculadas
            </h2>
            {joinedCommunities.length === 0 ? (
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                Aún no tienes áreas vinculadas. Selecciona una para priorizar evidencias, revisiones y búsqueda por dominio.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {joinedCommunities.map((community) => (
                  <Badge variant="green" key={community.id}>{community.name}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {filteredCommunities.map((community) => (
          <Card
            key={community.id}
            className="flex h-full flex-col justify-between overflow-hidden border border-slate-200/60 border-l-4 border-l-violet-600 bg-white/80 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800/60 dark:border-l-violet-500 dark:bg-slate-900/70"
          >
            <CardContent className="flex h-full flex-col justify-between space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="blue" className="px-2 py-0.5 text-[9px] uppercase tracking-wider">
                    {community.area}
                  </Badge>
                  <Landmark size={14} className="text-slate-400" />
                </div>
                <h2 className="font-display text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  {community.name}
                </h2>
                <p className="line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {community.description || 'Área de práctica disponible para evidencias y revisión por pares.'}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800/40">
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Users2 size={13} className="text-violet-500" />
                    <strong>{community.memberCount}</strong> revisores
                  </span>
                  <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <FileText size={13} className="text-indigo-500" />
                    <strong>{community.evidenceCount}</strong> evidencias
                  </span>
                </div>

                {community.joined ? (
                  <Button
                    variant="secondary"
                    onClick={() => leave(community.id)}
                    className="h-10 w-full rounded-lg text-xs font-bold uppercase tracking-wider"
                  >
                    <CheckCircle2 size={15} />
                    Vinculado · retirar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => join(community.id)}
                    className="h-10 w-full rounded-lg border-violet-100 text-xs font-bold uppercase tracking-wider text-violet-700 transition duration-300 hover:border-violet-300 hover:bg-violet-600 hover:text-white dark:border-violet-900/40 dark:text-violet-400 dark:hover:bg-violet-500 dark:hover:text-slate-950"
                  >
                    Vincularme al área
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCommunities.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/40 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/20">
            No hay áreas que coincidan con la búsqueda.
          </div>
        )}
      </section>
    </main>
  );
}
