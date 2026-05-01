import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ChatbotWidget({ page = 'dashboard', context = null }) {
  const { user } = useAuth();
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Bonjour ! Je suis votre assistant PI Assurance. Comment puis-je vous aider ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const r = await api.post('/api/chatbot/ask', {
        message: msg,
        role: user?.role || 'assureur',
        page,
        context,
      });
      setMessages(m => [...m, { role: 'bot', text: r.data.answer }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Une erreur est survenue. Vérifiez la connexion au backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') send(); };

  return (
    <>
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-icon"><Bot size={16} /></div>
            <div style={{ flex: 1 }}>
              <div className="chatbot-header-title">Assistant IA</div>
              <div className="chatbot-header-sub">Propulsé par Gemini</div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}><X size={14} /></button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className="chat-bubble">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <div className="chat-bubble" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  <span>En cours...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chatbot-input-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Posez votre question..."
              disabled={loading}
            />
            <button className="chatbot-send-btn" onClick={send} disabled={loading || !input.trim()}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      <button className="chatbot-fab" onClick={() => setOpen(o => !o)}>
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
