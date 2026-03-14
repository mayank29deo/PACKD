'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '../../../lib/AppContext';

export default function ChatPage() {
  const router = useRouter();
  const { userId } = useParams();
  const { conversations, sendMessage, markConversationRead, user } = useApp();
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const conv = conversations[userId];

  useEffect(() => {
    if (conv?.unread) markConversationRead(userId);
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages?.length]);

  if (!conv) {
    return (
      <div className="min-h-screen bg-packd-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-white font-bold">Conversation not found</p>
          <button onClick={() => router.back()} className="mt-4 text-packd-orange text-sm">← Go back</button>
        </div>
      </div>
    );
  }

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setImageUrl(url);
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed && !imageUrl) return;
    sendMessage(userId, trimmed || (imageUrl ? '' : ''), imageUrl);
    setText('');
    setImagePreview(null);
    setImageUrl(null);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const messages = conv.messages || [];

  return (
    <div className="min-h-screen bg-packd-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur-md border-b border-packd-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-packd-gray hover:text-packd-text text-xl flex-shrink-0">←</button>
          <div className="relative flex-shrink-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white ${conv.user.avatarColor}`}>
              {conv.user.avatar}
            </div>
            {conv.user.online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-packd-green border-2 border-packd-bg" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-none">{conv.user.name}</p>
            <p className="text-[11px] text-packd-gray mt-0.5">
              {conv.user.online ? '🟢 Online now' : `${conv.user.sport} · offline`}
            </p>
          </div>
          <button className="w-9 h-9 rounded-full bg-packd-card border border-packd-border flex items-center justify-center text-packd-gray hover:text-packd-text text-sm transition-colors">
            ⋯
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-3 overflow-y-auto pb-32">
        {/* Date separator */}
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-packd-border" />
          <span className="text-[10px] text-packd-gray/60 px-2">Today</span>
          <div className="flex-1 h-px bg-packd-border" />
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.fromMe ? 'flex-row-reverse' : 'flex-row'}`}>
            {!msg.fromMe && (
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 self-end ${conv.user.avatarColor}`}>
                {conv.user.avatar}
              </div>
            )}
            <div className={`max-w-[75%] space-y-1`}>
              {msg.imageUrl && (
                <div className={`rounded-2xl overflow-hidden ${msg.fromMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                  <img src={msg.imageUrl} alt="shared" className="w-full max-w-xs object-cover" />
                </div>
              )}
              {msg.text && (
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.fromMe
                    ? 'bg-packd-orange text-white rounded-tr-sm'
                    : 'bg-packd-card border border-packd-border text-packd-text rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              )}
              <p className={`text-[10px] text-packd-gray/60 ${msg.fromMe ? 'text-right' : 'text-left'} px-1`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-packd-bg/95 backdrop-blur-md border-t border-packd-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          {/* Image preview */}
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img src={imagePreview} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-packd-border" />
              <button
                onClick={() => { setImagePreview(null); setImageUrl(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Camera button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-10 h-10 rounded-full bg-packd-card border border-packd-border flex items-center justify-center text-packd-gray hover:text-packd-orange hover:border-packd-orange transition-all flex-shrink-0"
            >
              📷
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message…"
                rows={1}
                className="w-full bg-packd-card border border-packd-border rounded-2xl px-4 py-2.5 text-sm text-packd-text placeholder-packd-gray/60 focus:outline-none focus:border-packd-orange transition-colors resize-none leading-snug"
                style={{ maxHeight: '100px', overflowY: 'auto' }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!text.trim() && !imageUrl}
              className="w-10 h-10 rounded-full bg-packd-orange flex items-center justify-center text-white font-bold text-base flex-shrink-0 disabled:opacity-40 hover:bg-packd-orange-light transition-all active:scale-95"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
