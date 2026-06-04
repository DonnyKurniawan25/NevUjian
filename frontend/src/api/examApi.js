import api from './axiosConfig';

export const examApi = {
  // Exam CRUD
  getExams: (params) => api.get('/exams/', { params }),
  getExam: (id) => api.get(`/exams/${id}/`),
  createExam: (data) => api.post('/exams/', data),
  updateExam: (id, data) => api.put(`/exams/${id}/`, data),
  patchExam: (id, data) => api.patch(`/exams/${id}/`, data),
  deleteExam: (id) => api.delete(`/exams/${id}/`),
  toggleActive: (id) => api.post(`/exams/${id}/toggle_active/`),

  // Questions
  getQuestions: (examId, params) => api.get(`/exams/${examId}/questions/`, { params }),
  createQuestion: (examId, data) => api.post(`/exams/${examId}/questions/`, data),
  updateQuestion: (examId, qId, data) => api.put(`/exams/${examId}/questions/${qId}/`, data),
  deleteQuestion: (examId, qId) => api.delete(`/exams/${examId}/questions/${qId}/`),
  deleteAllQuestions: (examId) => api.delete(`/exams/${examId}/questions/delete-all/`),
  bulkCreateQuestions: (examId, questions) =>
    api.post(`/exams/${examId}/questions/bulk-create/`, { questions }),
  reorderQuestions: (examId, order) =>
    api.post(`/exams/${examId}/questions/reorder/`, { order }),
  importExcelQuestions: (examId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/exams/${examId}/questions/import-excel/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadQuestionsTemplate: (examId) =>
    api.get(`/exams/${examId}/questions/download-template/`, { responseType: 'blob' }),
  exportQuestionsDocx: (examId) =>
    api.get(`/exams/${examId}/questions/export-word/`, { responseType: 'blob' }),

  // Results
  getResults: (examId, params) => api.get(`/exams/${examId}/results/`, { params }),

  // Export
  exportExcel: (examId) => api.get(`/exams/${examId}/export/excel/`, { responseType: 'blob' }),
  exportPDF: (examId) => api.get(`/exams/${examId}/export/pdf/`, { responseType: 'blob' }),
  exportSessionPDF: (sessionId) => api.get(`/exams/sessions/${sessionId}/export-pdf/`, { responseType: 'blob' }),
  exportSessionDocx: (sessionId) => api.get(`/exams/sessions/${sessionId}/export-docx/`, { responseType: 'blob' }),

  // Student endpoints
  getStudentExams: () => api.get('/student/exams/'),
  startExamSession: (examId, data) => api.post(`/student/exams/${examId}/start/`, data),
  getMyExamSessions: () => api.get('/student/exam-sessions/'),
  getExamSession: (sessionId) => api.get(`/student/exam-sessions/${sessionId}/`),
  getTeacherExamSession: (sessionId) => api.get(`/exams/sessions/${sessionId}/`),
  saveAnswer: (sessionId, data) => api.post(`/student/exam-sessions/${sessionId}/answer/`, data),
  submitExam: (sessionId) => api.post(`/student/exam-sessions/${sessionId}/submit/`),
  reportViolation: (sessionId) => api.post(`/student/exam-sessions/${sessionId}/violation/`),

  // Students management
  getStudents: (params) => api.get('/auth/students/', { params }),
  createStudent: (data) => api.post('/auth/students/', data),
  getClasses: () => api.get('/auth/students/classes/'),

  // AI Integration
  getAISettings: () => api.get('/ai/settings/'),
  updateAISettings: (data) => api.put('/ai/settings/', data),
  testAIConnection: (data) => api.post('/ai/settings/test-connection/', data),
  generateQuestionsAI: (examId, data) => api.post(`/exams/${examId}/ai-generate-questions/`, data),
  gradeEssaysAI: (sessionId) => api.post(`/student/exam-sessions/${sessionId}/grade-essays/`),

  // Session management (teacher)
  deleteSession: (sessionId) => api.delete(`/exams/sessions/${sessionId}/`),
  manualGradeAnswer: (answerId, data) => api.patch(`/exams/answers/${answerId}/grade/`, data),
};

export default examApi;
