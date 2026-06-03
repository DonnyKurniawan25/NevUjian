import { createContext, useContext, useState } from 'react';

const GuestContext = createContext(null);

export function GuestProvider({ children }) {
  const [guestToken, setGuestToken] = useState(() => sessionStorage.getItem('guest_token'));
  const [guestInfo, setGuestInfo] = useState(() => {
    const saved = sessionStorage.getItem('guest_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('guest_session_id'));

  const saveGuestData = (token, info) => {
    sessionStorage.setItem('guest_token', token);
    sessionStorage.setItem('guest_info', JSON.stringify(info));
    setGuestToken(token);
    setGuestInfo(info);
  };

  const saveSessionId = (id) => {
    sessionStorage.setItem('guest_session_id', id);
    setSessionId(id);
  };

  const clearGuest = () => {
    sessionStorage.removeItem('guest_token');
    sessionStorage.removeItem('guest_info');
    sessionStorage.removeItem('guest_session_id');
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
