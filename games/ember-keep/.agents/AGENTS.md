# Agent Workspace Rules

## Auto Commit and Push Rule
- **Automatic Git Operations**: Upon successfully completing any code implementation, bug fix, refactoring, or file modifications requested by the user, the AI agent MUST automatically stage, commit, and push all workspace changes to GitHub before wrapping up.
- **Git Binary**: If the global `git` command is not found in PATH, use `C:\Users\marci\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe` or find the GitHub Desktop git binary dynamically in `$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe`.
- **Commit Workflow**:
  1. `git add .`
  2. `git commit -m "<concise summary of changes made>"`
  3. `git push origin main`
