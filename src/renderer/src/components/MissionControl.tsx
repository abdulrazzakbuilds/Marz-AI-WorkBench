import { useEffect, useMemo, useState } from 'react';
import {
  AddRounded,
  ArrowForwardRounded,
  AutoAwesomeRounded,
  CheckCircleRounded,
  CodeRounded,
  ContentCopyRounded,
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
import { invoke } from '@tauri-apps/api/core';

import { MissionAgent } from './MissionAgent';

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
  const [section, setSection] = useState<'missions' | 'agent'>('missions');
  const [handoffNotice, setHandoffNotice] = useState('');

  useEffect(() => {
    void invoke('set_mission_control_visible', { visible: open });
    return () => {
      void invoke('set_mission_control_visible', { visible: false });
    };
  }, [open]);

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
        ? `Act as my engineering partner. Help me complete this mission checkpoint: ${step.title}.\n\nProject: ${active.title}\nIntended outcome: ${active.outcome || 'Not specified yet.'}\n\nFirst inspect the relevant project context. Propose the smallest useful change, explain which files informed it, and give a verification step. Show a diff and wait for approval before writing files or running commands. Report only checks that actually ran.`
        : `Act as my learning coach. Help me complete this study checkpoint: ${step.title}.\n\nTopic: ${active.title}\nLearning outcome: ${active.outcome || 'Not specified yet.'}\n\nTeach one core idea clearly, give a short retrieval question without the answer, and wait for my attempt. Then explain any gap and ask me to rate my confidence. Finish with a review note and a teach-back prompt.`;
    onUsePrompt(prompt);
    onClose();
  };

  const copyHandoff = async () => {
    if (!active) return;
    const done = active.steps.filter((step) => step.done);
    const next = active.steps.find((step) => !step.done);
    const handoff = [
      `# ${active.title}`,
      '',
      `Mode: ${active.kind === 'study' ? 'Study' : 'Build'}`,
      `Outcome: ${active.outcome || 'Not defined yet'}`,
      `Progress: ${done.length}/${active.steps.length} checkpoints (${progress}%)`,
      '',
      '## Completed',
      ...(done.length
        ? done.map((step) => `- ${step.title}`)
        : ['- Nothing marked complete yet']),
      '',
      '## Next action',
      next
        ? `- ${next.title}`
        : '- All checkpoints are marked complete; review the notes and evidence.',
      '',
      '## Notes and evidence',
      active.notes.trim() ||
        '- Add what changed, what you verified, or what you learned.',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(handoff);
      setHandoffNotice('Mission handoff copied');
      window.setTimeout(() => setHandoffNotice(''), 2400);
    } catch {
      setHandoffNotice(
        'Clipboard unavailable. Select and copy the mission notes.',
      );
    }
  };

  const isStudy = active?.kind === 'study';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
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
          <Stack direction="row" spacing={1}>
            <Button
              variant={section === 'missions' ? 'contained' : 'outlined'}
              onClick={() => setSection('missions')}
            >
              Studio
            </Button>
            <Button
              variant={section === 'agent' ? 'contained' : 'outlined'}
              onClick={() => setSection('agent')}
            >
              Project Agent
            </Button>
          </Stack>
          <IconButton onClick={onClose} aria-label="Close Mission Control">
            ×
          </IconButton>
        </Box>

        {section === 'agent' && <MissionAgent />}
        {section === 'missions' && (
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
              Plan the work, build understanding, and leave with something you
              can verify.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
              <Chip icon={<CodeRounded />} label="Build with checkpoints" />
              <Chip icon={<SchoolRounded />} label="Study with recall" />
            </Stack>
          </Box>
        )}

        {section === 'missions' && (
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
                    Create a build or study mission to get a focused workflow
                    and useful AI prompts.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.1} className="mission-list">
                  {missions.map((mission) => {
                    const done = mission.steps.filter(
                      (step) => step.done,
                    ).length;
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
        )}

        {active && section === 'missions' && (
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
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyRounded />}
                  onClick={() => void copyHandoff()}
                >
                  Copy handoff
                </Button>
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
            <Box className="mission-handoff">
              <Box>
                <Typography variant="overline" className="mission-eyebrow">
                  {isStudy ? 'LEARNING TRAIL' : 'PROGRESS EVIDENCE'}
                </Typography>
                <Typography variant="body2">
                  {isStudy
                    ? 'Record the idea you can explain, the gap to revisit, and your next recall prompt.'
                    : 'Record what changed, how you verified it, and anything that still needs attention.'}
                </Typography>
              </Box>
              {handoffNotice && (
                <Typography variant="caption" role="status">
                  {handoffNotice}
                </Typography>
              )}
            </Box>
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
              label={
                isStudy
                  ? 'Learning notes and ideas to revisit'
                  : 'Changes, checks, and open questions'
              }
              value={active.notes}
              onChange={(event) => updateActive({ notes: event.target.value })}
            />
          </Paper>
        )}
      </DialogContent>
    </Dialog>
  );
}
