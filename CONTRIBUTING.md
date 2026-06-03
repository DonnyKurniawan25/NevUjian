# Contributing to NevUjian

Terima kasih atas minat Anda untuk berkontribusi pada NevUjian! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)

## 📜 Code of Conduct

Proyek ini mengikuti kode etik yang ramah dan inklusif. Dengan berpartisipasi, Anda diharapkan untuk menjunjung tinggi kode etik ini.

### Our Standards

- Menggunakan bahasa yang ramah dan inklusif
- Menghormati sudut pandang dan pengalaman yang berbeda
- Menerima kritik konstruktif dengan baik
- Fokus pada apa yang terbaik untuk komunitas
- Menunjukkan empati terhadap anggota komunitas lainnya

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- Git
- Text editor (VS Code recommended)

### Setup Development Environment

1. **Fork repository**
   ```bash
   # Fork via GitHub UI, kemudian clone
   git clone https://github.com/YOUR_USERNAME/NevUjian.git
   cd NevUjian
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Create branch untuk fitur baru**
   ```bash
   git checkout -b feature/nama-fitur-anda
   ```

## 💻 Development Process

### Branch Naming Convention

- `feature/` - Fitur baru
- `fix/` - Bug fixes
- `docs/` - Dokumentasi
- `refactor/` - Refactoring code
- `test/` - Menambah atau memperbaiki tests
- `style/` - Perubahan formatting, missing semi colons, etc

Contoh:
```bash
git checkout -b feature/add-video-proctoring
git checkout -b fix/exam-timer-bug
git checkout -b docs/update-api-documentation
```

### Development Workflow

1. **Buat issue** untuk diskusi fitur/bug
2. **Assign** issue ke diri sendiri
3. **Buat branch** dari `main`
4. **Develop** fitur dengan commit yang jelas
5. **Test** secara menyeluruh
6. **Push** ke fork Anda
7. **Create Pull Request** ke repository utama

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code sudah di-test
- [ ] Dokumentasi sudah diupdate
- [ ] Commit messages mengikuti convention
- [ ] Code mengikuti style guide
- [ ] No merge conflicts
- [ ] All tests passing

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing yang sudah dilakukan

## Screenshots (if applicable)
Add screenshots untuk UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. Maintainer akan review PR Anda
2. Diskusi dan revisi jika diperlukan
3. Approval dari minimal 1 maintainer
4. Merge ke main branch

## 📝 Coding Standards

### Python (Backend)

```python
# Follow PEP 8
# Use meaningful variable names
# Add docstrings for functions/classes

def calculate_exam_score(answers, correct_answers):
    """
    Calculate exam score based on answers.
    
    Args:
        answers (list): Student's answers
        correct_answers (list): Correct answers
        
    Returns:
        float: Score percentage
    """
    # Implementation
    pass
```

### JavaScript/React (Frontend)

```javascript
// Use functional components with hooks
// Use meaningful component names
// Add PropTypes or TypeScript

import { useState, useEffect } from 'react';

export default function ExamCard({ exam, onEdit, onDelete }) {
  const [loading, setLoading] = useState(false);
  
  // Component logic
  
  return (
    <div className="exam-card">
      {/* JSX */}
    </div>
  );
}
```

### CSS

```css
/* Use BEM naming convention */
/* Mobile-first approach */
/* Use CSS variables */

.exam-card {
  /* Base styles */
}

.exam-card__title {
  /* Element styles */
}

.exam-card--featured {
  /* Modifier styles */
}

@media (max-width: 768px) {
  /* Mobile styles */
}
```

## 💬 Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: Fitur baru
- `fix`: Bug fix
- `docs`: Dokumentasi
- `style`: Formatting, missing semi colons, etc
- `refactor`: Refactoring code
- `test`: Menambah tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(exam): add video proctoring feature

- Implement webcam access
- Add face detection
- Store proctoring logs

Closes #123

---

fix(auth): resolve token expiration issue

Token was expiring too quickly causing users to logout unexpectedly.
Increased token lifetime to 24 hours.

Fixes #456

---

docs(readme): update installation instructions

Added more detailed steps for Windows users
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test

# Run specific test
python manage.py test exams.tests.test_models

# With coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests

```bash
cd frontend
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Manual Testing Checklist

- [ ] Test di Chrome, Firefox, Safari
- [ ] Test di mobile devices (iOS & Android)
- [ ] Test dark mode
- [ ] Test dengan slow network
- [ ] Test edge cases
- [ ] Test error handling

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
 - OS: [e.g. Windows 10]
 - Browser: [e.g. Chrome 96]
 - Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
A clear description of what you want to happen

**Describe alternatives you've considered**
Alternative solutions or features

**Additional context**
Any other context or screenshots
```

## 📚 Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Community

- GitHub Discussions: Untuk diskusi umum
- GitHub Issues: Untuk bug reports dan feature requests
- Email: support@nevujian.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to NevUjian! 🎉