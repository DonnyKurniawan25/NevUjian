import { createContext, useContext, useState } from 'react';

const GuestContext = createContext(null);

export function GuestProvider({ children }) {
  const [guestToken, setGuestToken] = useState(() => localStorage.getItem('guest_token'));
  const [guestInfo, setGuestInfo] = useState(() => {
    const saved = localStorage.getItem('guest_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('guest_session_id'));

  const saveGuestData = (token, info) => {
    localStorage.setItem('guest_token', token);
    localStorage.setItem('guest_info', JSON.stringify(info));
    setGuestToken(token);
    setGuestInfo(info);
  };

  const saveSessionId = (id) => {
    localStorage.setItem('guest_session_id', id);
    setSessionId(id);
  };

  const clearGuest = () => {
    localStorage.removeItem('guest_token');
    localStorage.removeItem('guest_info');
    localStorage.removeItem('guest_session_id');
    setGuestToken(null);
    setGuestInfo(null);
    setSessionId(null);
  };

  return (
    <GuestContext.Provider value={{
      guestToken, guestInfo, sessionId,
      saveGuestData, saveSessionId, clearGuest,
    }}>
      {children}
    </GuestContext.Provider>
  );
}

export const useGuest = () => {
  const context = useContext(GuestContext);
  if (!context) throw new Error('useGuest must be used within GuestProvider');
  return context;
};

export default GuestContext;
