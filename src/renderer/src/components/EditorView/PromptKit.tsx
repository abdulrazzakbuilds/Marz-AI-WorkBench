import { Fragment, type ReactNode, useState } from 'react';
import { Code, School } from '@mui/icons-material';
import {
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';

interface PromptGroup {
  group: string;
  icon: ReactNode;
  items: { label: string; prompt: string }[];
}

const STARTERS: PromptGroup[] = [
  {
    group: 'Developer',
    icon: <Code fontSize="small" />,
    items: [
      {
        label: 'Explain code',
        prompt:
          'Explain this code step by step. Include its purpose, important parts, and any assumptions:\n\n',
      },
      {
        label: 'Debug an issue',
        prompt:
          'Help me debug this issue. First explain the likely cause, then suggest a minimal fix and how I can verify it.\n\nProblem:\n\nCode or error:\n',
      },
      {
        label: 'Review code',
        prompt:
          'Review the code below for correctness, security, performance, and readability. List findings by severity and suggest concrete fixes.\n\n',
      },
      {
        label: 'Plan a feature',
        prompt:
          'Help me plan this feature. Break it into small implementation steps, identify files or components likely involved, and call out risks.\n\nFeature:\n',
      },
    ],
  },
  {
    group: 'Student',
    icon: <School fontSize="small" />,
    items: [
      {
        label: 'Learn a topic',
        prompt:
          'Teach me this topic in clear steps. Start with the basics, use a simple example, then ask one question to check my understanding.\n\nTopic:\n',
      },
      {
        label: 'Study notes',
        prompt:
          'Turn the material below into concise study notes with key terms, main ideas, and a short recap. Keep facts grounded in the source.\n\n',
      },
      {
        label: 'Practice quiz',
        prompt:
          'Create a short practice quiz about this topic. Ask one question at a time, wait for my answer, and explain the solution.\n\nTopic:\n',
      },
      {
        label: 'Essay outline',
        prompt:
          'Help me build an essay outline. Ask for the assignment requirements if they are missing, then propose a thesis and a structured outline.\n\nPrompt:\n',
      },
    ],
  },
];

interface PromptKitProps {
  onInsert: (prompt: string) => void;
}

export function PromptKit({ onInsert }: PromptKitProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <Button
        size="small"
        startIcon={<Code />}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        Prompt kit
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        {STARTERS.map((group) => (
          <Fragment key={group.group}>
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <ListItemIcon>{group.icon}</ListItemIcon>
              <Typography variant="overline" color="text.secondary">
                {group.group}
              </Typography>
            </MenuItem>
            {group.items.map((item) => (
              <MenuItem
                key={item.label}
                sx={{ pl: 5 }}
                onClick={() => {
                  onInsert(item.prompt);
                  setAnchor(null);
                }}
              >
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
          </Fragment>
        ))}
      </Menu>
    </>
  );
}
