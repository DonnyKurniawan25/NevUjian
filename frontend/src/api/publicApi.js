import axios from 'axios';

const publicApi = axios.create({
  baseURL: '/api/public',
  headers: { 'Content-Type': 'application/json' },
});

// Add guest token to requests if available
publicApi.interceptors.request.use((config) => {
  const guestToken = sessionStorage.getItem('guest_token');
  if (guestToken) {
    config.headers.Authorization = `Guest ${guestToken}`;
  }
  return config;
});

export const guestApi = {
  // Public exam info
  getExam: (examCode) => publicApi.get(`/exams/${examCode}/`),
  validateToken: (examCode, examToken) =>
    publicApi.post(`/exams/${examCode}/validate-token/`, { exam_token: examToken }),

  // Guest registration & session
  register: (examCode, data) => publicApi.post(`/exams/${examCode}/guest-register/`, data),
  startExam: (examCode) => publicApi.post(`/exams/${examCode}/start/`),
  getSession: (sessionId) => publicApi.get(`/exam-sessions/${sessionId}/`),
  exportSessionPDF: (sessionId) => publicApi.get(`/exam-sessions/${sessionId}/export-pdf/`, { responseType: 'blob' }),
  exportSessionDocx: (sessionId) => publicApi.get(`/exam-sessions/${sessionId}/export-docx/`, { responseType: 'blob' }),
  saveAnswer: (sessionId, data) => publicApi.post(`/exam-sessions/${sessionId}/answer/`, data),
  submitExam: (sessionId) => publicApi.post(`/exam-sessions/${sessionId}/submit/`),
  reportViolation: (sessionId) => publicApi.post(`/exam-sessions/${sessionId}/violation/`),
};

export default guestApi;
