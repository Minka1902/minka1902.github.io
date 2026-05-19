import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Pencil, Loader2, Sparkles, Check, X } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useTraining } from '@/hooks/useTraining';
import { scoreTrainingSession } from '@/lib/trainingAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TRAINING_TYPES } from '@/lib/constants';
import { fmtDate, fmtTime } from '@/lib/utils';
import TrainingTypeSpecificFields from '@/components/training/TrainingTypeSpecificFields';

export default function TrainingSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { activeDog } = useDog();
  const { sessions, loading, updateSession } = useTraining(activeDog?.id ?? '');
  const session = sessions.find(s => s.id === sessionId);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState(false);
  const [scoreInput, setScoreInput] = useState('');

  if (!activeDog) return <Navigate to="/training" replace />;
  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3"><Skeleton className="h-8 flex-1" /><Skeleton className="h-6 w-24 rounded-full" /></div>
      <div className="rounded-xl border bg-card p-5 space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-10 w-20" /><Skeleton className="h-16 w-full" /></div>
      <div className="rounded-xl border bg-card p-5 space-y-3"><Skeleton className="h-5 w-28" />{[1,2,3].map(i=><Skeleton key={i} className="h-4 w-full" />)}</div>
    </div>
  );
  if (!session) return <Navigate to="/training" replace />;

  const typeLabel = TRAINING_TYPES.find(t => t.type === session.trainingType)?.label ?? session.trainingType;
  const effectiveScore = session.userScore ?? session.aiScore;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const { score, analysis } = await scoreTrainingSession(session);
      await updateSession(session.id, {
        aiScore: score,
        aiAnalysis: analysis,
        aiScoredAt: Date.now(),
        scoreSource: session.userScore !== undefined ? 'both' : 'ai',
      });
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveUserScore = async () => {
    const val = parseInt(scoreInput);
    if (isNaN(val) || val < 1 || val > 100) return;
    await updateSession(session.id, {
      userScore: val,
      scoreSource: session.aiScore !== undefined ? 'both' : 'user',
    });
    setEditingScore(false);
    setScoreInput('');
  };

  const handleStartEdit = () => {
    setScoreInput(String(effectiveScore ?? ''));
    setEditingScore(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-[88px]">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold flex-1">{typeLabel}</h1>
        <Badge variant="outline">{fmtDate(session.scheduledAt)}</Badge>
      </div>

      {/* AI Score card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base">Session Score</CardTitle>
            {!analyzing && (
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-semibold transition-colors w-full sm:w-auto justify-center sm:justify-start"
                style={{ backgroundColor: 'oklch(0.55 0.15 280 / 0.12)', color: 'oklch(0.72 0.15 280)' }}
              >
                <Sparkles className="h-3 w-3" />
                {session.aiScore !== undefined ? 'Re-analyze' : 'Analyze Session'}
              </button>
            )}
            {analyzing && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground w-full sm:w-auto">
                <Loader2 className="h-3 w-3 animate-spin" /> Analyzing…
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {effectiveScore !== undefined ? (
            <div className="flex flex-wrap items-center gap-3">
              {/* Score display */}
              <div className="flex items-center gap-2">
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{ fontFamily: 'var(--font-heading)', color: 'oklch(0.55 0.15 280)' }}
                >
                  {effectiveScore}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: session.userScore !== undefined ? 'oklch(0.64 0.168 48 / 0.12)' : 'oklch(0.55 0.15 280 / 0.10)',
                    color: session.userScore !== undefined ? 'oklch(0.64 0.168 48)' : 'oklch(0.55 0.15 280)',
                  }}
                >
                  {session.userScore !== undefined ? 'Your score' : 'AI'}
                </span>
                {session.userScore !== undefined && session.aiScore !== undefined && (
                  <span className="text-xs text-muted-foreground">AI: {session.aiScore}/100</span>
                )}
              </div>
              {/* Inline edit */}
              {!editingScore ? (
                <button onClick={handleStartEdit} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors" aria-label="Edit score">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={1} max={100}
                    value={scoreInput}
                    onChange={e => setScoreInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveUserScore(); if (e.key === 'Escape') setEditingScore(false); }}
                    className="w-16 text-xs border border-input rounded px-2 py-1 bg-background outline-none focus:border-primary/50"
                    autoFocus
                  />
                  <button onClick={handleSaveUserScore} className="p-1 rounded text-green-500 hover:text-green-400 transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditingScore(false)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {analyzing ? 'Analyzing this session with AI…' : 'Click "Analyze Session" to get an AI-generated score.'}
            </p>
          )}
          {session.aiAnalysis && (
            <p className="text-sm leading-relaxed text-muted-foreground border-t pt-3">{session.aiAnalysis}</p>
          )}
          {analyzeError && (
            <p className="text-xs text-red-500">{analyzeError}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Session Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Objective</p>
            <p className="text-muted-foreground">{session.objective}</p>
          </div>
          {session.location && (
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">{session.location}</p>
            </div>
          )}
          {session.durationActualMin !== undefined && (
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-muted-foreground">{session.durationActualMin} min</p>
            </div>
          )}
          {session.notes && (
            <div>
              <p className="font-medium">Notes</p>
              <p className="text-muted-foreground">{session.notes}</p>
            </div>
          )}
          <div>
            <p className="font-medium">Trainer</p>
            <p className="text-muted-foreground">{session.trainerName}</p>
          </div>
          <div>
            <p className="font-medium">Logged</p>
            <p className="text-muted-foreground">{fmtTime(session.createdAt)}</p>
          </div>

          {session.typeSpecificData && Object.keys(session.typeSpecificData).length > 0 && (
            <TrainingTypeSpecificFields
              trainingType={session.trainingType}
              values={session.typeSpecificData}
              onChange={() => {}}
              readOnly
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
