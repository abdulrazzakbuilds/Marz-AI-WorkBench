import { useEffect, useMemo, useState } from 'react';
import {
  AddRounded,
  ArrowForwardRounded,
  AutoAwesomeRounded,
  CheckCircleRounded,
  CodeRounded,
  DeleteOutlineRounded,
  FlagRounded,
  SchoolRounded,
  TaskAltRounded,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

type MissionKind = 'build' | 'study';
type MissionStep = { id: string; title: string; done: boolean };
type Mission = {
  id: string;
  title: string;
  outcome: string;
  kind: MissionKind;
  notes: string;
  steps: MissionStep[];
  updatedAt: number;
};

const STORAGE_KEY = 'marz-workbench-missions-v1';
const WORKFLOWS: Record<MissionKind, string[]> = {
  build: [
    'Define the problem',
    'Plan the implementation',
    'Build the solution',
    'Verify and review',
  ],
  study: [
    'Set learning outcomes',
    'Learn the core ideas',
    'Practice from memory',
    'Review and teach back',
  ],
};

function readMissions(): Mission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is Mission =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        Array.isArray(item.steps),
    );
  } catch {
    return [];
  }
}

function createMission(
  kind: MissionKind,
  title: string,
  outcome: string,
): Mission {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    outcome: outcome.trim(),
    kind,
    notes: '',
    steps: WORKFLOWS[kind].map((step) => ({
      id: crypto.randomUUID(),
      title: step,
      done: false,
    })),
    updatedAt: Date.now(),
  };
}

interface MissionControlProps {
  open: boolean;
  onClose: () => void;
  onUsePrompt: (prompt: string) => void;
}

export function MissionControl({
  open,
  onClose,
  onUsePrompt,
}: MissionControlProps) {
  const [missions, setMissions] = useState<Mission[]>(readMissions);
  const [activeId, setActiveId] = useState<string | null>(
    () => readMissions()[0]?.id ?? null,
  );
  const [kind, setKind] = useState<MissionKind>('build');
  const [title, setTitle] = useState('');
  const [outcome, setOutcome] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
    if (activeId && !missions.some((mission) => mission.id === activeId)) {
      setActiveId(missions[0]?.id ?? null);
    }
  }, [missions, activeId]);

  const active = missions.find((mission) => mission.id === activeId) ?? null;
  const progress = useMemo(() => {
    if (!active?.steps.length) return 0;
    return Math.round(
      (active.steps.filter((step) => step.done).length / active.steps.length) *
        100,
    );
  }, [active]);

  const updateActive = (patch: Partial<Mission>) => {
    if (!active) return;
    setMissions((items) =>
      items.map((mission) =>
        mission.id === active.id
          ? { ...mission, ...patch, updatedAt: Date.now() }
          : mission,
      ),
    );
  };

  const addMission = () => {
    if (!title.trim()) return;
    const mission = createMission(kind, title, outcome);
    setMissions((items) => [mission, ...items]);
    setActiveId(mission.id);
    setTitle('');
    setOutcome('');
  };

  const handleUseStep = (step: MissionStep) => {
    if (!active) return;
    const prompt =
      active.kind === 'build'
        ? `Act as my engineering partner. Help me work on this project step: ${step.title}.\n\nProject: ${active.title}\nIntended outcome: ${active.outcome || 'Not specified yet.'}\n\nFirst ask only for missing context that would change the solution. Then give me a concrete plan, explain key trade-offs, and finish with a verification checklist. Keep changes small and explain how I can verify them.`
        : `Act as my learning coach. Help me complete this study step: ${step.title}.\n\nTopic: ${active.title}\nLearning outcome: ${active.outcome || 'Not specified yet.'}\n\nTeach the core idea clearly, use a worked example, then ask me a short question to check understanding. Do not reveal the answer until I try. End with a concise review note I can keep.`;
    onUsePrompt(prompt);
    onClose();
  };

  const isStudy = active?.kind === 'study';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { className: 'mission-dialog' } }}
    >
      <DialogContent className="mission-content">
        <Box className="mission-topbar">
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box className="mission-mark">
              <AutoAwesomeRounded />
            </Box>
            <Box>
              <Typography variant="overline" className="mission-eyebrow">
                MARZ AI WORKBENCH
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Mission Control
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} aria-label="Close Mission Control">
            ×
          </IconButton>
        </Box>

        <Box className="mission-hero">
          <Box className="mission-orb mission-orb-one" />
          <Box className="mission-orb mission-orb-two" />
          <Typography className="mission-kicker">
            <FlagRounded fontSize="small" /> MAKE PROGRESS VISIBLE
          </Typography>
          <Typography variant="h3" className="mission-headline">
            Turn a big idea into
            <br />
            your next clear step.
          </Typography>
          <Typography className="mission-subtitle">
            Plan the work, build understanding, and leave with something you can
            verify.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
            <Chip icon={<CodeRounded />} label="Build with checkpoints" />
            <Chip icon={<SchoolRounded />} label="Study with recall" />
          </Stack>
        </Box>

        <Box className="mission-grid">
          <Paper className="mission-panel mission-create" elevation={0}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', mb: 2 }}
            >
              <AddRounded color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 750 }}>
                Start a mission
              </Typography>
            </Stack>
            <Select
              size="small"
              fullWidth
              value={kind}
              onChange={(event) => setKind(event.target.value as MissionKind)}
            >
              <MenuItem value="build">Build a project</MenuItem>
              <MenuItem value="study">Study a subject</MenuItem>
            </Select>
            <TextField
              size="small"
              fullWidth
              label={
                kind === 'build' ? 'Project or problem' : 'Subject or concept'
              }
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addMission()}
            />
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              label="What does success look like?"
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
            />
            <Button
              variant="contained"
              endIcon={<ArrowForwardRounded />}
              onClick={addMission}
              disabled={!title.trim()}
              className="mission-create-button"
            >
              Create mission
            </Button>
            <Typography variant="caption" color="text.secondary">
              Saved on this device. No account or cloud service required.
            </Typography>
          </Paper>

          <Paper className="mission-panel mission-board" elevation={0}>
            <Stack
              direction="row"
              sx={{
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="overline" className="mission-eyebrow">
                  YOUR WORKSPACE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 750 }}>
                  Active missions
                </Typography>
              </Box>
              <Chip size="small" label={`${missions.length} saved`} />
            </Stack>
            {missions.length === 0 ? (
              <Box className="mission-empty">
                <Box className="mission-empty-icon">
                  <TaskAltRounded />
                </Box>
                <Typography sx={{ fontWeight: 700 }}>
                  Your next win starts here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a build or study mission to get a focused workflow and
                  useful AI prompts.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.1} className="mission-list">
                {missions.map((mission) => {
                  const done = mission.steps.filter((step) => step.done).length;
                  return (
                    <Paper
                      key={mission.id}
                      elevation={0}
                      onClick={() => setActiveId(mission.id)}
                      className={`mission-list-item ${activeId === mission.id ? 'selected' : ''}`}
                    >
                      <Box className="mission-list-icon">
                        {mission.kind === 'study' ? (
                          <SchoolRounded />
                        ) : (
                          <CodeRounded />
                        )}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                          {mission.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {done}/{mission.steps.length} checkpoints
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={
                          mission.steps.length
                            ? (done / mission.steps.length) * 100
                            : 0
                        }
                        className="mission-mini-progress"
                      />
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Box>

        {active && (
          <Paper className="mission-detail" elevation={0}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              sx={{ justifyContent: 'space-between', gap: 2 }}
            >
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center' }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {active.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={isStudy ? 'STUDY' : 'BUILD'}
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {active.outcome ||
                    'Add an intended outcome so each step has a clear direction.'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box className="mission-progress-ring">{progress}%</Box>
                <IconButton
                  aria-label="Delete mission"
                  onClick={() =>
                    setMissions((items) =>
                      items.filter((item) => item.id !== active.id),
                    )
                  }
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </Stack>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              className="mission-progress"
            />
            <Box className="mission-steps">
              {active.steps.map((step, index) => (
                <Box
                  className={`mission-step ${step.done ? 'complete' : ''}`}
                  key={step.id}
                >
                  <IconButton
                    aria-label={
                      step.done ? 'Mark step incomplete' : 'Mark step complete'
                    }
                    size="small"
                    onClick={() =>
                      updateActive({
                        steps: active.steps.map((item) =>
                          item.id === step.id
                            ? { ...item, done: !item.done }
                            : item,
                        ),
                      })
                    }
                  >
                    {step.done ? (
                      <CheckCircleRounded color="success" />
                    ) : (
                      <Box className="mission-step-number">
                        {String(index + 1).padStart(2, '0')}
                      </Box>
                    )}
                  </IconButton>
                  <Typography sx={{ flex: 1, fontWeight: 650 }}>
                    {step.title}
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardRounded />}
                    onClick={() => handleUseStep(step)}
                  >
                    Work on this
                  </Button>
                </Box>
              ))}
            </Box>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              label="Project notes and what you learned"
              value={active.notes}
              onChange={(event) => updateActive({ notes: event.target.value })}
            />
          </Paper>
        )}
      </DialogContent>
    </Dialog>
  );
}
