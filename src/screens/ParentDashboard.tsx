import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { storage } from '../services/storage';
import { SECTION_CONFIGS, getSectionConfig } from '../config/sections';
import { getWeakSkills, getStrongSkills, generateWeeklyPlan } from '../services/adaptive';
import type { SkillStats, Session } from '../types';

interface Props {
  childId: string;
  onBack: () => void;
}

export default function ParentDashboard({ childId, onBack }: Props) {
  const [tab, setTab] = useState<'overview' | 'sections' | 'trends' | 'plan'>('overview');

  const sessions = storage.getSessions(childId);
  const allStats = storage.getSkillStats(childId);
  const weakSkills = getWeakSkills(childId);
  const strongSkills = getStrongSkills(childId);
  const settings = storage.getSettings();

  // Overview data
  const totalSessions = sessions.length;
  const totalQuestions = sessions.reduce(
    (sum, s) => sum + s.sections.reduce((ss, sec) => ss + sec.questions.length, 0), 0
  );
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.totalScore || 0), 0) / totalSessions)
    : 0;
  const totalMinutes = Math.round(
    sessions.reduce((sum, s) => sum + (s.totalTimeSec || 0), 0) / 60
  );

  // Section accuracy chart data
  const sectionChartData = SECTION_CONFIGS.map(sc => {
    const sectionStats = allStats.filter(s => s.sectionType === sc.type);
    const avgMastery = sectionStats.length > 0
      ? Math.round(sectionStats.reduce((sum, s) => sum + s.masteryScore, 0) / sectionStats.length)
      : 0;
    const avgTime = sectionStats.length > 0
      ? Math.round(sectionStats.reduce((sum, s) => sum + s.avgTimeSec, 0) / sectionStats.length)
      : 0;
    return {
      name: sc.nameHe,
      דיוק: avgMastery,
      'זמן ממוצע': avgTime,
      fill: sc.color,
    };
  });

  // Trend data (last 7 sessions)
  const trendData = useMemo(() => {
    const recent = sessions.slice(-10);
    return recent.map((s, i) => {
      const date = new Date(s.startedAt);
      return {
        name: `${date.getDate()}/${date.getMonth() + 1}`,
        ציון: s.totalScore || 0,
        'זמן (דק)': Math.round((s.totalTimeSec || 0) / 60),
      };
    });
  }, [sessions]);

  // Skill heatmap data
  const skillHeatmapData = SECTION_CONFIGS.map(sc => {
    const skills = sc.skills.map(skill => {
      const stat = allStats.find(s => s.sectionType === sc.type && s.skillTag === skill.tag);
      return {
        name: skill.nameHe,
        mastery: stat?.masteryScore || 0,
        attempts: stat?.attempts || 0,
      };
    });
    return { section: sc, skills };
  });

  // Speed vs accuracy analysis
  const speedErrors = sessions.reduce((sum, s) => {
    return sum + s.sections.reduce((ss, sec) => {
      return ss + sec.questions.filter(q => !q.isCorrect && (q.timeSpentSec || 0) < 15).length;
    }, 0);
  }, 0);
  const understandingErrors = sessions.reduce((sum, s) => {
    return sum + s.sections.reduce((ss, sec) => {
      return ss + sec.questions.filter(q => !q.isCorrect && (q.timeSpentSec || 0) >= 15).length;
    }, 0);
  }, 0);

  // Weekly plan
  const [weeklyPlan, setWeeklyPlan] = useState<string[]>([]);
  const generatePlan = () => {
    const recommendations = generateWeeklyPlan(childId);
    const plan = recommendations.map(r => r.payload.message);
    setWeeklyPlan(plan);
  };

  const tabs = [
    { id: 'overview' as const, label: 'סקירה' },
    { id: 'sections' as const, label: 'נושאים' },
    { id: 'trends' as const, label: 'מגמות' },
    { id: 'plan' as const, label: 'תוכנית' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-2xl cursor-pointer hover:opacity-70">→</button>
        <div>
          <h1 className="text-2xl font-bold">דשבורד הורים</h1>
          <p className="text-sm text-text-secondary">נתוני {settings.childName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-border rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              tab === t.id ? 'bg-card text-primary shadow-sm' : 'text-text-secondary hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <MetricCard value={totalSessions} label="אימונים" color="text-primary" />
            <MetricCard value={avgScore + '%'} label="ציון ממוצע" color="text-success" />
            <MetricCard value={totalQuestions} label="שאלות" color="text-warning" />
            <MetricCard value={totalMinutes + ' דק׳'} label="זמן תרגול" color="text-purple" />
          </div>

          {/* Error Analysis */}
          <div className="bg-card rounded-2xl p-4 border border-border mb-4">
            <h3 className="font-bold mb-3">ניתוח טעויות:</h3>
            <div className="flex gap-4">
              <div className="flex-1 text-center p-3 rounded-xl bg-orange-50">
                <div className="text-2xl font-bold text-warning">{speedErrors}</div>
                <div className="text-xs text-text-secondary">טעויות מהירות</div>
                <div className="text-xs text-text-secondary">(תשובה מהירה מדי)</div>
              </div>
              <div className="flex-1 text-center p-3 rounded-xl bg-blue-50">
                <div className="text-2xl font-bold text-primary">{understandingErrors}</div>
                <div className="text-xs text-text-secondary">טעויות הבנה</div>
                <div className="text-xs text-text-secondary">(חשבו אבל טעו)</div>
              </div>
            </div>
          </div>

          {/* Strong & Weak */}
          {strongSkills.length > 0 && (
            <div className="bg-green-50 rounded-2xl p-4 border border-success mb-4">
              <h3 className="font-bold text-success mb-2">נושאים חזקים 💪</h3>
              <ul className="text-sm space-y-1">
                {strongSkills.slice(0, 3).map(s => {
                  const sc = SECTION_CONFIGS.find(c => c.type === s.sectionType);
                  const skill = sc?.skills.find(sk => sk.tag === s.skillTag);
                  return (
                    <li key={s.id}>
                      {sc?.icon} {skill?.nameHe} - שליטה {s.masteryScore}%
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {weakSkills.length > 0 && (
            <div className="bg-red-50 rounded-2xl p-4 border border-danger mb-4">
              <h3 className="font-bold text-danger mb-2">צריך חיזוק 📚</h3>
              <ul className="text-sm space-y-1">
                {weakSkills.slice(0, 3).map(s => {
                  const sc = SECTION_CONFIGS.find(c => c.type === s.sectionType);
                  const skill = sc?.skills.find(sk => sk.tag === s.skillTag);
                  return (
                    <li key={s.id}>
                      {sc?.icon} {skill?.nameHe} - שליטה {s.masteryScore}%
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sections Tab */}
      {tab === 'sections' && (
        <div>
          {/* Bar Chart */}
          <div className="bg-card rounded-2xl p-4 border border-border mb-6">
            <h3 className="font-bold mb-4">דיוק לפי פרק:</h3>
            <div style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sectionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="דיוק" radius={[6, 6, 0, 0]}>
                    {sectionChartData.map((entry, idx) => (
                      <rect key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Heatmap */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <h3 className="font-bold mb-4">מפת מיומנויות:</h3>
            {skillHeatmapData.map(sh => (
              <div key={sh.section.type} className="mb-4">
                <h4 className="font-semibold text-sm mb-2">
                  {sh.section.icon} {sh.section.nameHe}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {sh.skills.map(skill => (
                    <div
                      key={skill.name}
                      className="p-2 rounded-lg text-center text-xs"
                      style={{
                        backgroundColor: `rgba(${skill.mastery > 60 ? '5, 150, 105' : skill.mastery > 30 ? '217, 119, 6' : '220, 38, 38'}, ${Math.max(0.1, skill.mastery / 100)})`,
                        color: skill.mastery > 50 ? 'white' : '#1E293B',
                      }}
                    >
                      <div className="font-medium">{skill.name}</div>
                      <div>{Math.round(skill.mastery)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div>
          {trendData.length > 1 ? (
            <>
              <div className="bg-card rounded-2xl p-4 border border-border mb-6">
                <h3 className="font-bold mb-4">מגמת ציונים:</h3>
                <div style={{ direction: 'ltr' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis domain={[0, 100]} fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="ציון" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4 border border-border">
                <h3 className="font-bold mb-4">זמן תרגול:</h3>
                <div style={{ direction: 'ltr' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="זמן (דק)" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <div className="text-4xl mb-3">📊</div>
              <p>צריך לפחות 2 אימונים כדי לראות מגמות</p>
            </div>
          )}
        </div>
      )}

      {/* Plan Tab */}
      {tab === 'plan' && (
        <div>
          {/* Quick Insights */}
          <div className="bg-card rounded-2xl p-4 border border-border mb-4">
            <h3 className="font-bold mb-3">תובנות:</h3>
            <div className="space-y-2 text-sm">
              {weakSkills.length > 0 && (
                <Insight
                  icon="📚"
                  text={`מומלץ לתרגל ${SECTION_CONFIGS.find(c => c.type === weakSkills[0]?.sectionType)?.nameHe || ''} - שם יש הכי הרבה מקום לשיפור`}
                />
              )}
              {strongSkills.length > 0 && (
                <Insight
                  icon="🌟"
                  text={`התקדמות יפה ב${SECTION_CONFIGS.find(c => c.type === strongSkills[0]?.sectionType)?.nameHe || ''}`}
                />
              )}
              {speedErrors > understandingErrors && (
                <Insight
                  icon="⏱️"
                  text="רוב הטעויות הן מחיפזון - כדאי לתרגל בלי טיימר"
                />
              )}
              {understandingErrors > speedErrors && (
                <Insight
                  icon="🧠"
                  text="הטעויות דורשות חיזוק בהבנה - מומלץ מצב חיזוק חכם"
                />
              )}
              {totalSessions < 3 && (
                <Insight
                  icon="💪"
                  text="עוד מעט נתונים וניתן המלצות מדויקות יותר"
                />
              )}
            </div>
          </div>

          {/* Generate Plan */}
          <button
            onClick={generatePlan}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl cursor-pointer hover:bg-primary-dark transition-colors mb-4"
          >
            צור תוכנית תרגול לשבוע 📅
          </button>

          {weeklyPlan.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-bold mb-3">תוכנית לשבוע:</h3>
              <div className="space-y-2">
                {weeklyPlan.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start text-sm">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  );
}

function Insight({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex gap-2 items-start p-2 rounded-lg bg-bg">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
