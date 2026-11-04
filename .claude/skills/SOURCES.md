# Installed skills — sources

Each folder was copied as-is from its upstream repository after a review
(no hidden instructions found; scripts only run when a skill is used).

| Skill | Source | Commit |
|---|---|---|
| frontend-design | github.com/anthropics/skills · skills/frontend-design | ca45fc4 |
| web-design-guidelines | github.com/vercel-labs/agent-skills · skills/web-design-guidelines | 1a2c79d |
| ui-ux-pro-max | github.com/nextlevelbuilder/ui-ux-pro-max-skill · .claude/skills/ui-ux-pro-max | ccce51c |
| design-taste-frontend | github.com/Leonxlnx/taste-skill · skills/taste-skill | 12af471 |
| high-end-visual-design | github.com/Leonxlnx/taste-skill-classics · skills/soft-skill | 5e08c93 |
| shadcn | github.com/shadcn-ui/ui · skills/shadcn | 8a35366 |
| emil-design-eng | github.com/emilkowalski/skills · skills/emil-design-eng | f1090be |
| brainstorming | github.com/obra/superpowers · skills/brainstorming | 22f0b46 |
| hyperframes | github.com/heygen-com/hyperframes · skills/hyperframes | 1ff4cef |
| ai-avatar-video | github.com/inference-sh/skills · tools/video/ai-avatar-video | 0cbf91c |
| just-scrape | github.com/scrapegraphai/just-scrape · skills/just-scrape | a3d179f |
| supabase | github.com/supabase/agent-skills · skills/supabase | c9be0e9 |
| seo-audit | github.com/coreyhaines31/marketingskills · skills/seo-audit | 88c79f6 |

Notes
- web-design-guidelines fetches its rule list from vercel-labs/web-interface-guidelines at run time.
- just-scrape needs the `just-scrape` npm CLI and a paid ScrapeGraph API key (SGAI_API_KEY).
- ai-avatar-video needs the inference.sh `belt` CLI and an inference.sh account.
- hyperframes' locate script calls Gemini only if a Gemini API key is provided.
