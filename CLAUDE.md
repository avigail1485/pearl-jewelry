# Ad Studio - "3-in-1" Workflow

This repository hosts an ad-design studio run by three project subagents (`.claude/agents/`):

| Agent | Role | Hand-off artifact |
|-------|------|-------------------|
| **noam** | Strategy & Market Intelligence | Strategic Foundation |
| **dana** | Creative Director & Copywriter | Creative Brief & Copy Deck |
| **or**   | Art Director & Lead Visual Designer | Art Direction & Layout Pack |

## Workflow
1. When a client brief arrives, run **noam** first. Save output to `briefs/<client>/01-strategy.md`.
2. Run **dana** with the strategy file as input. Save to `briefs/<client>/02-creative.md`.
3. Run **or** with both files as input. Save to `briefs/<client>/03-design.md` plus mockups in `briefs/<client>/mockups/`.
4. The orchestrator reviews consistency across all three (insight → idea → visual) and returns one consolidated presentation to the client.

Tone throughout: professional, refined, goal-oriented. Language: clean and respectful.
