import React, { useMemo, useState } from 'react';
import { Maximize2, Network, Search, X } from 'lucide-react';
import { useSkills } from '../hooks/useSkills.js';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Input } from './ui/input.jsx';
import { Tabs } from './ui/tabs.jsx';

const levelColors = {
  principiante: '#38bdf8',
  intermedio: '#10b981',
  avanzado: '#f59e0b'
};

const levelLabels = {
  principiante: 'Inicial',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado'
};

export function SkillMap({ userId }) {
  const [level, setLevel] = useState('todos');
  const [name, setName] = useState('');
  const [expanded, setExpanded] = useState(false);
  const { skills } = useSkills(userId, { level, name });
  const graph = useMemo(() => buildGraph(skills), [skills]);

  const graphView = (
    <SkillGraph graph={graph} heightClass={expanded ? 'h-[72vh]' : 'h-[300px] md:h-[340px]'} expanded={expanded} />
  );

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Network size={20} />
              Mapa de habilidades
            </CardTitle>
            {skills.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(true)} title="Ampliar mapa">
                <Maximize2 size={15} />
                Ampliar
              </Button>
            )}
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
              <Input className="pl-9" placeholder="Filtrar habilidad" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <Tabs
              value={level}
              onChange={setLevel}
              tabs={[
                { value: 'todos', label: 'Todas' },
                { value: 'principiante', label: 'Inicial' },
                { value: 'intermedio', label: 'Intermedio' },
                { value: 'avanzado', label: 'Avanzado' }
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {skills.length === 0 ? (
            <p className="text-sm text-slate-500">No hay habilidades para estos filtros.</p>
          ) : (
            <>
              {graphView}
              <SkillList skills={skills} />
            </>
          )}
        </CardContent>
      </Card>

      {expanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Vista ampliada</p>
                <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">Mapa de habilidades</h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(false)} title="Cerrar vista ampliada">
                <X size={16} />
                Cerrar
              </Button>
            </div>
            <div className="min-h-0 flex-1 p-4">{graphView}</div>
          </div>
        </div>
      )}
    </>
  );
}

function SkillGraph({ graph, heightClass, expanded }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <svg viewBox="0 0 760 460" className={`${heightClass} w-full`} role="img" aria-label="Grafo de habilidades">
        {graph.nodes.map((node) => (
          <line key={`edge-${node.name}`} x1="380" y1="230" x2={node.x} y2={node.y} stroke="#cbd5e1" strokeWidth="1.5" />
        ))}
        <circle cx="380" cy="230" r={expanded ? 54 : 48} fill="#0f172a" />
        <text x="380" y="224" textAnchor="middle" fill="white" fontSize="14" fontWeight="800">
          Perfil
        </text>
        <text x="380" y="243" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="700">
          competencial
        </text>
        {graph.nodes.map((node) => (
          <SkillNode key={node.name} node={node} expanded={expanded} />
        ))}
      </svg>
    </div>
  );
}

function SkillNode({ node, expanded }) {
  const lines = wrapLabel(node.name, expanded ? 18 : 14, expanded ? 4 : 3);
  const lineHeight = expanded ? 13 : 11;
  const startY = node.y - ((lines.length - 1) * lineHeight) / 2 + 4;

  return (
    <g>
      <title>{`${node.name} · ${levelLabels[node.level] ?? node.level} · ${node.strength} pts`}</title>
      <circle cx={node.x} cy={node.y} r={node.radius} fill={levelColors[node.level] ?? '#10b981'} opacity="0.96" />
      {lines.map((line, index) => (
        <text
          key={`${node.name}-${line}-${index}`}
          x={node.x}
          y={startY + index * lineHeight}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#0f172a"
          fontSize={expanded ? 10.5 : 9}
          fontWeight="800"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function SkillList({ skills }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {skills.map((skill) => {
        let badgeVariant = 'blue';

        if (skill.level === 'avanzado') {
          badgeVariant = 'green';
        } else if (skill.level === 'intermedio') {
          badgeVariant = 'gold';
        }

        const domainScore = skill.strength ?? 0;
        const progressPercent = Math.min(100, domainScore);

        return (
          <div
            key={skill.name}
            className="flex flex-col gap-2 rounded-xl border border-slate-200/50 bg-white/40 p-4 shadow-sm transition-all duration-300 hover:border-violet-200 dark:border-slate-800/40 dark:bg-slate-900/30 dark:hover:border-violet-900/60"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-sm font-black text-slate-800 dark:text-white" title={skill.name}>
                {skill.name}
              </p>
              <Badge variant={badgeVariant} className="shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-wide">
                {levelLabels[skill.level] ?? 'Inicial'}
              </Badge>
            </div>

            <div className="mt-1 space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <span>Dominio Competencial</span>
                <span className="text-slate-700 dark:text-slate-200">{domainScore} pts</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-1.5 flex items-center justify-between border-t border-slate-100/50 pt-1.5 text-[10px] text-slate-400 dark:border-slate-800/40 dark:text-slate-500">
              <span>
                {skill.evidenceCount} {skill.evidenceCount === 1 ? 'evidencia' : 'evidencias'} de soporte
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-400">{skill.validations} val. ponderadas</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildGraph(skills) {
  const maxStrength = Math.max(1, ...skills.map((skill) => skill.strength));
  const count = Math.max(1, Math.min(skills.length, 8));
  const nodes = skills.slice(0, 8).map((skill, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const distance = 135 + (index % 2) * 50;
    const radius = 48 + Math.round((skill.strength / maxStrength) * 13);
    return {
      ...skill,
      x: 380 + Math.cos(angle) * distance,
      y: 230 + Math.sin(angle) * distance,
      radius
    };
  });
  return { nodes };
}

function wrapLabel(value, maxChars, maxLines) {
  const words = String(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word.length > maxChars ? `${word.slice(0, Math.max(3, maxChars - 1))}.` : word;
    if (lines.length >= maxLines - 1) break;
  }

  if (current && lines.length < maxLines) lines.push(current);
  if (words.join(' ').length > lines.join(' ').length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\.+$/, '')}.`;
  }
  return lines.length ? lines : ['Habilidad'];
}
