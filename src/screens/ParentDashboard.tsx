import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { storage } from '../services/storage';
import { SECTION_CONFIGS } from '../config/sections';
import { getWeakSkills, getStrongSkills, generateWeeklyPlan } from '../services/adaptive';



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

  const trendData = useMemo(() => {
    const recent = sessions.slice(-10);
    return recent.map((s) => {
      const date = new Date(s.startedAt);
      return {
        name: `${date.getDate()}/${date.getMonth() + 1}`,
        ציון: s.totalScore || 0,
        'זמן (דק)': Math.round((s.totalTimeSec || 0) / 60),
      };
    });
  }, [sessions]);

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
    <div className="max-w-2xl mx-auto px-4 py-6 min-h-screen relative">
      <div className="bg-shapes">
        <div className="bg-shape" style={{ width: 200, height: 200, top: '5%', right: '-10%', background: '#E85D3A' }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <button onClick={onBack} className="text-2xl cursor-pointer hover:opacity-70 text-primary-light">→</button>
        <div>
          <h1 className="text-2xl font-extrabold text-glow">דשבורד הורים</h1>
          <p className="text-sm text-text-secondary">נתוני {settings.childName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-xl p-1 mb-6 relative z-10 border border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              tab === t.id
                ? 'bg-primary/20 text-primary-light shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="stat-badge">
              <div className="stat-value">{totalSessions}</div>
              <div className="text-xs text-text-secondary mt-1">אימונים</div>
            </div>
            <div className="stat-badge">
              <div className="stat-value">{avgScore}%</div>
              <div className="text-xs text-text-secondary mt-1">ציון ממוצע</div>
            </div>
            <div className="stat-badge">
              <div className="stat-value">{totalQuestions}</div>
              <div className="text-xs text-text-secondary mt-1">שאלות</div>
            </div>
            <div className="stat-badge">
              <div className="stat-value">{totalMinutes}</div>
              <div className="text-xs text-text-secondary mt-1">דקות תרגול</div>
            </div>
          </div>

          {/* Error Analysis */}
          <div className="game-card p-4 mb-4">
            <h3 className="font-bold mb-3">ניתוח טעויות:</h3>
            <div className="flex gap-4">
              <div className="flex-1 text-center p-3 rounded-xl bg-warning/10 border border-warning/20">
                <div className="text-2xl font-bold text-warning">{speedErrors}</div>
                <div className="text-xs text-text-secondary">טעויות מהירות</div>
                <div className="text-xs text-text-secondary">(תשובה מהירה מדי)</div>
              </div>
              <div className="flex-1 text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
                <div className="text-2xl font-bold text-primary-light">{understandingErrors}</div>
                <div className="text-xs text-text-secondary">טעויות הבנה</div>
                <div className="text-xs text-text-secondary">(חשבו אבל טעו)</div>
              </div>
            </div>
          </div>

          {strongSkills.length > 0 && (
            <div className="result-correct rounded-2xl p-4 mb-4">
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
            <div className="result-wrong rounded-2xl p-4 mb-4">
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
        <div className="relative z-10">
          <div className="game-card p-4 mb-6">
            <h3 className="font-bold mb-4">דיוק לפי פרק:</h3>
            <div style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sectionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#5C3D1E" />
                  <XAxis dataKey="name" fontSize={12} stroke="#B8976A" />
                  <YAxis domain={[0, 100]} fontSize={12} stroke="#B8976A" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#3B2415', border: '1px solid #5C3D1E', borderRadius: '8px', color: '#FFF5E4' }}
                  />
                  <Bar dataKey="דיוק" radius={[6, 6, 0, 0]}>
                    {sectionChartData.map((entry, idx) => (
                      <rect key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="game-card p-4">
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
                      className="p-2 rounded-lg text-center text-xs border"
                      style={{
                        backgroundColor: `rgba(${skill.mastery > 60 ? '0, 184, 148' : skill.mastery > 30 ? '253, 203, 110' : '255, 107, 107'}, ${Math.max(0.1, skill.mastery / 200)})`,
                        borderColor: `rgba(${skill.mastery > 60 ? '0, 184, 148' : skill.mastery > 30 ? '253, 203, 110' : '255, 107, 107'}, 0.3)`,
                        color: '#FFF5E4',
                      }}
                    >
                      <div className="font-medium">{skill.name}</div>
                      <div className="font-bold">{Math.round(skill.mastery)}%</div>
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
        <div className="relative z-10">
          {trendData.length > 1 ? (
            <>
              <div className="game-card p-4 mb-6">
                <h3 className="font-bold mb-4">מגמת ציונים:</h3>
                <div style={{ direction: 'ltr' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#5C3D1E" />
                      <XAxis dataKey="name" fontSize={12} stroke="#B8976A" />
                      <YAxis domain={[0, 100]} fontSize={12} stroke="#B8976A" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#3B2415', border: '1px solid #5C3D1E', borderRadius: '8px', color: '#FFF5E4' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="ציון" stroke="#E85D3A" strokeWidth={2} dot={{ r: 4, fill: '#E85D3A' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="game-card p-4">
                <h3 className="font-bold mb-4">זמן תרגול:</h3>
                <div style={{ direction: 'ltr' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#5C3D1E" />
                      <XAxis dataKey="name" fontSize={12} stroke="#B8976A" />
                      <YAxis fontSize={12} stroke="#B8976A" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#3B2415', border: '1px solid #5C3D1E', borderRadius: '8px', color: '#FFF5E4' }}
                      />
                      <Bar dataKey="זמן (דק)" fill="#E85D3A" radius={[6, 6, 0, 0]} />
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
        <div className="relative z-10">
          <div className="game-card p-4 mb-4">
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

          <button
            onClick={generatePlan}
            className="btn-game w-full text-lg mb-4"
          >
            צור תוכנית תרגול לשבוע 📅
          </button>

          {weeklyPlan.length > 0 && (
            <div className="game-card p-4">
              <h3 className="font-bold mb-3">תוכנית לשבוע:</h3>
              <div className="space-y-2">
                {weeklyPlan.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start text-sm">
                    <span className="text-primary-light font-bold">{i + 1}.</span>
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

function Insight({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex gap-2 items-start p-2 rounded-lg bg-bg-light border border-border/50">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
