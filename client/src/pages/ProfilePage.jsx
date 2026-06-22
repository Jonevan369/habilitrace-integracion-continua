import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Award, Download, FileJson, ShieldCheck } from 'lucide-react';
import { api } from '../api/client.js';
import { EvidenceCard } from '../components/EvidenceCard.jsx';
import { ProgressChart } from '../components/ProgressChart.jsx';
import { SkillMap } from '../components/SkillMap.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useFollow } from '../hooks/useFollow.js';
import { downloadJson } from '../lib/utils.js';

function getInitials(name) {
  if (!name) return 'HT';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState('');
  const follow = useFollow(profile?.isFollowing ?? false);

  async function refresh() {
    const next = await api.profile(userId);
    setProfile(next);
    setSelectedSkill(next.evidences?.[0]?.suggestions?.[0]?.name ?? '');
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, [userId]);

  const allSkills = useMemo(() => {
    const names = new Set();
    profile?.evidences?.forEach((evidence) => evidence.suggestions.forEach((skill) => names.add(skill.name)));
    return [...names];
  }, [profile]);

  if (!profile) return <main className="p-6">Cargando perfil...</main>;
  const ownProfile = user?.id === Number(userId);

  async function exportProfile() {
    const payload = await api.exportProfile(userId);
    downloadJson(`habilitrace-profile-${userId}.json`, payload);
  }

  async function mint(badgeId) {
    const payload = await api.mintCredential(badgeId);
    downloadJson(`habilitrace-credential-${badgeId}.json`, payload);
    refresh();
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-6">
        <Card className="bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
              {/* Avatar con iniciales y gradiente */}
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 font-display text-2xl font-black text-white shadow-md shadow-violet-500/20">
                {getInitials(profile.user.name)}
              </div>
              
              {/* Información y Acciones */}
              <div className="flex-1 min-w-0 space-y-3 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-0.5">
                    <h1 className="text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white">
                      {profile.user.name}
                    </h1>
                    <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                      {profile.user.headline}
                    </p>
                  </div>
                  
                  {/* Fila de Acciones en la cabecera */}
                  <div className="flex items-center justify-center md:justify-end gap-2 shrink-0">
                    {!ownProfile ? (
                      <Button 
                        onClick={() => follow.toggle(userId)} 
                        variant={follow.following ? 'secondary' : 'default'}
                        className="h-9 rounded-lg"
                      >
                        {follow.following ? 'Observando' : 'Observar'}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={exportProfile} 
                        className="h-9 rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        <Download size={15} />
                        <span>Exportar JSON</span>
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto md:mx-0">
                  {profile.user.bio || 'Sin biografía disponible en este perfil.'}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1.5">
                  <Badge variant="green" className="py-0.5 px-2.5">
                    <Award size={13} />
                    Reputación {profile.user.karma}
                  </Badge>
                  <Badge variant="secondary" className="py-0.5 px-2.5">
                    {profile.stats.followers} observadores
                  </Badge>
                  <Badge variant="secondary" className="py-0.5 px-2.5">
                    {profile.stats.following} seguidos
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        <SkillMap userId={userId} />

        <Card>
          <CardContent className="space-y-3 pt-5">
            <h2 className="text-lg font-black">Credenciales</h2>
            <div className="grid gap-3">
              {profile.badges.length === 0 && <p className="text-sm text-slate-500">Aun no hay credenciales automaticas.</p>}
              {profile.badges.map((badge) => (
                <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3 dark:bg-slate-900" key={badge.id}>
                  <div>
                    <p className="font-bold">{badge.title}</p>
                    <p className="text-xs text-slate-500">Umbral {badge.threshold} · {badge.mintedHash ? 'Credencial emitida' : 'Pendiente de acuñar'}</p>
                  </div>
                  {ownProfile && (
                    <Button size="sm" variant="secondary" onClick={() => mint(badge.id)}>
                      {badge.mintedHash ? <ShieldCheck size={16} /> : <FileJson size={16} />}
                      VC
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-5">
            <h2 className="text-lg font-black">Progreso por competencia</h2>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={selectedSkill}
              onChange={(event) => setSelectedSkill(event.target.value)}
            >
              {allSkills.map((skill) => <option key={skill}>{skill}</option>)}
            </select>
          </CardContent>
        </Card>
        <ProgressChart userId={userId} skill={selectedSkill} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">Evidencias del perfil</h2>
        {profile.evidences.map((evidence) => <EvidenceCard evidence={evidence} onChanged={refresh} key={evidence.id} />)}
      </section>
    </main>
  );
}
