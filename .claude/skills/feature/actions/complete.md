# Complete Action

1. Update current-feature.md FIRST (before any commit):
   - Change H1 back to `# Current Feature`
   - Set Status to "Not Started"
   - Clear Goals and Notes sections (keep placeholder comments)
   - Add feature summary to the END of History
2. Stage all changes with `git add .` — feature code + current-feature.md together
3. Commit everything in ONE commit with the feature message (feat: ...)
4. Switch to main and merge the feature branch (no push yet)
5. Delete the local feature branch
6. **Push main to origin ONCE** — only after merge is done
7. If feature branch was previously pushed, delete it from origin