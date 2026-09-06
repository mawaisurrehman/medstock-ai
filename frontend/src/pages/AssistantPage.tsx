import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Mic,
  ArrowRight,
  ShieldCheck,
  Package,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AssistantMessage } from '../types';
import { apiService } from '../services/apiService';

// Static greeting shown at conversation start (UI chrome, not data)
const WELCOME_MESSAGE: AssistantMessage = {
  id: 'msg-welcome',
  sender: 'BOT',
  text: 'Hello! I am your MedStock AI Clinical Inventory Assistant. I monitor live stock levels from the hospital database, forecast patient demand, and suggest proactive reorders and transfers. How can I assist you today?',
  urduText:
    'خوش آمدید! میں آپ کا میڈسٹاک اے آئی اسسٹنٹ ہوں۔ میں ہسپتال میں ادویات کی ضرورت کا پیشگی تخمینہ لگانے اور قلت سے بچاؤ میں آپ کی مدد کے لیے حاضر ہوں۔',
  timestamp: 'Just now',
};

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast, language } = useApp();

  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const isUrdu = /[\u0600-\u06FF]/.test(text) || language === 'ur';
    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: 'USER',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const reply = await apiService.sendAssistantMessage(text, isUrdu);
      const botMsg: AssistantMessage = {
        id: reply.id,
        sender: 'BOT',
        text: reply.text,
        urduText: reply.urduText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: reply.quickActions?.map((qa) => ({
          label: qa.label,
          actionType: 'NAVIGATE' as const,
          payload: qa.action,
        })),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.warn('Assistant error', e);
      addToast({
        type: 'error',
        title: 'Assistant Unavailable',
        message: 'Could not reach the MedStock AI backend. Please try again.',
      });
      const errMsg: AssistantMessage = {
        id: `msg-${Date.now()}`,
        sender: 'BOT',
        text: 'Sorry, I could not reach the MedStock AI service. Please verify the backend server is running and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: 'info',
      message: 'Assistant response copied to clipboard.',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                MedStock Clinical AI Assistant
              </h1>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Bilingual (EN / اردو)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Healthcare inventory query intelligence grounded in hospital telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages([WELCOME_MESSAGE])}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Clear conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Prompt Pills (Prompt Section 18) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-bold text-[11px] shrink-0">Try asking:</span>
        <button
          onClick={() =>
            handleSend('Which medicines are at critical risk of stockout?')
          }
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:bg-teal-50/40 shrink-0 font-medium transition-colors"
        >
          Which medicines are at critical risk of stockout?
        </button>
        <button
          onClick={() => handleSend('Explain why Insulin needs to be reordered now.')}
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:bg-teal-50/40 shrink-0 font-medium transition-colors"
        >
          Explain why Insulin needs to be reordered now
        </button>
        <button
          onClick={() => handleSend('How can we reduce our medicine expiry waste?')}
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:bg-teal-50/40 shrink-0 font-medium transition-colors"
        >
          How can we reduce our medicine expiry waste?
        </button>
        <button
          onClick={() => handleSend('کون سی ادویات ختم ہونے کے خطرے میں ہیں؟')}
          className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 font-urdu shrink-0 font-medium transition-colors"
        >
          کون سی ادویات ختم ہونے کے خطرے میں ہیں؟
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {messages.map((msg) => {
          const isBot = msg.sender === 'BOT';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isBot
                    ? 'bg-slate-50 border border-slate-200 text-slate-800'
                    : 'bg-teal-700 text-white shadow-xs'
                }`}
              >
                <div className="font-semibold text-slate-900">{isBot ? 'MedStock AI' : 'You'}</div>
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Optional Urdu Translation toggle / display */}
                {isBot && msg.urduText && (
                  <div className="mt-2 pt-2 border-t border-slate-200 font-urdu text-sm text-teal-900 bg-teal-50/50 p-2.5 rounded-xl text-right">
                    {msg.urduText}
                  </div>
                )}

                {/* Direct Action Buttons embedded in response */}
                {isBot && msg.actions && msg.actions.length > 0 && (
                  <div className="pt-2 space-y-1.5 border-t border-slate-200">
                    {msg.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(act.payload)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-white border border-teal-200 hover:border-teal-500 hover:bg-teal-50 text-teal-900 font-bold flex items-center justify-between text-xs transition-colors shadow-2xs"
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer Controls for bot message */}
                {isBot && (
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.text)}
                        className="hover:text-slate-600 p-0.5"
                        title="Copy text"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() =>
                          addToast({ type: 'info', message: 'Feedback recorded.' })
                        }
                        className="hover:text-slate-600 p-0.5"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() =>
                          addToast({ type: 'info', message: 'Feedback recorded.' })
                        }
                        className="hover:text-slate-600 p-0.5"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isBot && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 items-center text-xs text-slate-400">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
              <span
                className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"
                style={{ animationDelay: '0.15s' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"
                style={{ animationDelay: '0.3s' }}
              />
              <span className="ml-2 text-[11px] font-medium text-slate-500">
                Evaluating clinical parameters...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask MedStock AI about stockout predictions, expiry risks, or supplier lead times..."
          className="flex-1 px-3 py-2 text-xs bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
        />

        <button
          onClick={() =>
            addToast({
              type: 'info',
              message: 'Audio input listening enabled in preview browser.',
            })
          }
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Voice query"
        >
          <Mic className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all disabled:opacity-40 shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
