# 📝 Git Commands untuk Push ke GitHub

Panduan lengkap untuk push project NevUjian ke GitHub.

## 🚀 Quick Start

### 1. Inisialisasi Git Repository

```bash
# Pastikan Anda berada di root directory project
cd d:/Fullstack/NevUjian

# Inisialisasi git (jika belum)
git init

# Cek status
git status
```

### 2. Add Files ke Staging

```bash
# Add semua file
git add .

# Atau add file spesifik
git add README.md
git add frontend/
git add backend/

# Cek file yang akan di-commit
git status
```

### 3. Commit Changes

```bash
# Commit dengan message
git commit -m "Initial commit: NevUjian v1.0.0 with mobile responsive design"

# Atau commit dengan message detail
git commit -m "feat: initial release with mobile responsive design

- Complete exam management system
- AI-powered essay grading
- Multi-mode access (Login/Guest/Both)
- Full mobile responsive with bottom navigation
- Dark mode support
- Real-time monitoring
- Comprehensive documentation"
```

### 4. Create GitHub Repository

1. Buka [GitHub](https://github.com)
2. Klik tombol **"New"** atau **"+"** → **"New repository"**
3. Isi detail repository:
   - **Repository name**: `NevUjian`
   - **Description**: `Sistem Ujian Online Modern dengan AI dan Mobile Responsive`
   - **Visibility**: Public atau Private (pilih sesuai kebutuhan)
   - **JANGAN** centang "Initialize with README" (karena sudah ada)
4. Klik **"Create repository"**

### 5. Connect ke GitHub Repository

```bash
# Add remote repository
git remote add origin https://github.com/USERNAME/NevUjian.git

# Ganti USERNAME dengan username GitHub Anda
# Contoh: git remote add origin https://github.com/johndoe/NevUjian.git

# Verify remote
git remote -v
```

### 6. Push ke GitHub

```bash
# Push ke branch main
git push -u origin main

# Jika branch Anda bernama master, gunakan:
# git push -u origin master

# Atau jika diminta rename branch:
git branch -M main
git push -u origin main
```

## 🔐 Authentication

### Menggunakan Personal Access Token (Recommended)

1. **Generate Token**:
   - Buka GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Klik "Generate new token (classic)"
   - Beri nama: `NevUjian Development`
   - Pilih scopes: `repo` (full control)
   - Klik "Generate token"
   - **COPY TOKEN** (tidak akan ditampilkan lagi!)

2. **Gunakan Token saat Push**:
   ```bash
   # Saat diminta password, paste token Anda
   Username: your-github-username
   Password: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Save Credentials** (opsional):
   ```bash
   # Windows
   git config --global credential.helper wincred
   
   # Mac
   git config --global credential.helper osxkeychain
   
   # Linux
   git config --global credential.helper store
   ```

### Menggunakan SSH (Alternative)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy public key
# Windows:
type ~/.ssh/id_ed25519.pub | clip
# Mac:
pbcopy < ~/.ssh/id_ed25519.pub
# Linux:
cat ~/.ssh/id_ed25519.pub

# Add ke GitHub: Settings → SSH and GPG keys → New SSH key

# Test connection
ssh -T git@github.com

# Change remote to SSH
git remote set-url origin git@github.com:USERNAME/NevUjian.git
```

## 📦 Useful Git Commands

### Status & Info

```bash
# Cek status
git status

# Cek log commits
git log
git log --oneline
git log --graph --oneline --all

# Cek remote
git remote -v

# Cek branch
git branch
git branch -a
```

### Branching

```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# List branches
git branch

# Delete branch
git branch -d feature/old-feature
```

### Updating

```bash
# Pull latest changes
git pull origin main

# Fetch without merge
git fetch origin

# Merge branch
git merge feature/new-feature
```

### Undoing Changes

```bash
# Discard changes in working directory
git checkout -- filename

# Unstage file
git reset HEAD filename

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert commit (create new commit)
git revert commit-hash
```

### Stashing

```bash
# Save changes temporarily
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and remove stash
git stash pop

# Clear all stashes
git stash clear
```

## 🔄 Workflow untuk Update

### Setelah Membuat Changes

```bash
# 1. Cek perubahan
git status
git diff

# 2. Add changes
git add .

# 3. Commit
git commit -m "feat: add new feature"

# 4. Push
git push origin main
```

### Conventional Commits

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting
refactor: # Code refactoring
test:     # Tests
chore:    # Maintenance

# Examples:
git commit -m "feat(exam): add video proctoring"
git commit -m "fix(auth): resolve token expiration"
git commit -m "docs(readme): update installation guide"
git commit -m "style(mobile): improve button spacing"
```

## 🏷️ Tagging Releases

```bash
# Create tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0

# Push all tags
git push origin --tags

# List tags
git tag

# Delete tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

## 🔍 Troubleshooting

### Error: "fatal: remote origin already exists"

```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/USERNAME/NevUjian.git
```

### Error: "Updates were rejected"

```bash
# Pull first, then push
git pull origin main --rebase
git push origin main

# Or force push (CAREFUL!)
git push -f origin main
```

### Error: "Permission denied (publickey)"

```bash
# Check SSH key
ssh -T git@github.com

# Or use HTTPS instead
git remote set-url origin https://github.com/USERNAME/NevUjian.git
```

### Large Files Warning

```bash
# If you have large files, use Git LFS
git lfs install
git lfs track "*.psd"
git add .gitattributes
git commit -m "Add Git LFS"
```

## 📋 Pre-Push Checklist

- [ ] Semua file penting sudah di-add
- [ ] .gitignore sudah benar
- [ ] Tidak ada file sensitif (.env, passwords, keys)
- [ ] README.md sudah lengkap
- [ ] Commit message jelas dan deskriptif
- [ ] Code sudah di-test
- [ ] Documentation up-to-date

## 🎯 Best Practices

1. **Commit Often**: Small, focused commits
2. **Clear Messages**: Descriptive commit messages
3. **Pull Before Push**: Always pull latest changes first
4. **Branch Strategy**: Use branches for features
5. **Review Changes**: Check `git diff` before commit
6. **Backup**: Keep local backup before force push
7. **Security**: Never commit sensitive data
8. **Documentation**: Update docs with code changes

## 📚 Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

## 🆘 Need Help?

- GitHub Issues: Report problems
- GitHub Discussions: Ask questions
- Email: support@nevujian.com

---

Happy Coding! 🚀