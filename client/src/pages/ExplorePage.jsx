import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Award, FileCheck2, Landmark, Network, Search, UserRound } from 'lucide-react';
import { api } from '../api/client.js';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';

const quickFilters = ['React', 'backend', 'electricidad', 'soldadura', 'UX', 'datos', 'plantas'];

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('search') ?? '');
  const [results, setResults] = useState({ users: [], evidences: [], communities: [], competences: [] });
  const activeQuery = params.get('search') ?? '';

  useEffect(() => {
    if (!activeQuery) {
      api.search('React').then(setResults).catch(() => setResults({ users: [], evidences: [], communities: [], competences: [] }));
      return;
    }
    api.search(activeQuery).then(setResults).catch(() => setResults({ users: [], evidences: [], communities: [], competences: [] }));
  }, [activeQuery]);

  function submit(event) {
    event.preventDefault();
    setParams(query.trim() ? { search: query.trim() } : {});
  }

  const totalResults = useMemo(
    () => results.users.length + results.evidences.length + results.communities.length + results.competences.length,
    [results]
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_440px] lg:items-end">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Explorar</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Búsqueda competencial
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Encuentra perfiles, evidencias, áreas de práctica y competencias validadas desde un solo lugar.
          </p>
        </div>
        <form onSubmit={submit} className="relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 pl-11"
            placeholder="Buscar por habilidad, oficio, área o persona..."
          />
        </form>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {quickFilters.map((filter) => (
          <button
            type="button"
            onClick={() => {
              setQuery(filter);
              setParams({ search: filter });
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            key={filter}
          >
            {filter}
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-slate-400">
          {activeQuery ? `${totalResults} resultados para "${activeQuery}"` : 'Sugerencias iniciales'}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ResultSection icon={<UserRound size={18} />} title="Perfiles" empty="No se encontraron perfiles.">
          <div className="grid gap-4 md:grid-cols-2">
            {results.users.map((user) => (
              <Link to={`/profile/${user.id}`} key={user.id} className="group block">
                <Card className="h-full border border-slate-200/60 bg-white/80 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/70">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 font-display text-sm font-black text-white">
                        {initials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display text-lg font-black text-slate-900 group-hover:text-violet-700 dark:text-white">
                          {user.name}
                        </h2>
                        <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{user.headline}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="green">
                        <Award size={13} />
                        Karma {user.karma}
                      </Badge>
                      {user.topSkills?.slice(0, 3).map((skill) => (
                        <Badge variant="secondary" key={skill.name}>{skill.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </ResultSection>

        <ResultSection icon={<FileCheck2 size={18} />} title="Evidencias" empty="No se encontraron evidencias.">
          <div className="grid gap-4">
            {results.evidences.map((evidence) => (
              <Link to={`/profile/${evidence.authorId}`} key={evidence.id} className="group block">
                <Card className="border border-slate-200/60 bg-white/80 transition hover:border-violet-300 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/70">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">
                          {evidence.author?.name}
                        </p>
                        <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">{evidence.title}</h2>
                      </div>
                      <Badge variant={evidence.status === 'prevalidated_ai' ? 'green' : 'gold'}>
                        {statusLabel(evidence.status)}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{evidence.body}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {evidence.suggestions?.slice(0, 3).map((skill) => (
                        <Badge variant="secondary" key={skill.id}>{skill.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </ResultSection>

        <ResultSection icon={<Landmark size={18} />} title="Áreas" empty="No se encontraron áreas.">
          <div className="grid gap-4 md:grid-cols-2">
            {results.communities.map((community) => (
              <Link to="/communities" key={community.id} className="group block">
                <Card className="h-full border border-slate-200/60 bg-white/80 transition hover:border-violet-300 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/70">
                  <CardContent className="space-y-3 p-5">
                    <Badge variant="blue">{community.area}</Badge>
                    <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">{community.name}</h2>
                    <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{community.description}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {community.memberCount} revisores · {community.evidenceCount} evidencias
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </ResultSection>

        <ResultSection icon={<Network size={18} />} title="Competencias" empty="No se encontraron competencias.">
          <div className="flex flex-wrap gap-2">
            {results.competences.map((competence) => (
              <Badge variant="blue" className="px-3 py-1.5" key={competence.name}>
                {competence.name} · {competence.evidenceCount} evid. · {Math.round((competence.averageConfidence ?? 0) * 100)}%
              </Badge>
            ))}
          </div>
        </ResultSection>
      </div>
    </main>
  );
}

function ResultSection({ icon, title, empty, children }) {
  const hasChildren = React.Children.toArray(children).some((child) => child?.props?.children?.length !== 0);
  return (
    <section className="space-y-3">
      <h2 className="font-display flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
        <span className="rounded-lg bg-violet-50 p-2 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">{icon}</span>
        {title}
      </h2>
      {hasChildren ? children : <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-800">{empty}</p>}
    </section>
  );
}

function initials(name) {
  return String(name || 'HT')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function statusLabel(status) {
  const labels = {
    prevalidated_ai: 'Prevalidada',
    needs_human_review: 'Revisión',
    insufficient: 'Insuficiente'
  };
  return labels[status] ?? 'Abierta';
}
