'use client';

import { useState } from 'react';

interface ChatFormProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatForm({ onSendMessage, disabled }: ChatFormProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
        disabled={disabled}
        className="flex-1 px-3 py-2 rounded border border-border bg-bg text-text placeholder-muted focus:outline-none focus:border-accent disabled:opacity-50"
        autoComplete="off"
        required
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="px-4 py-2 bg-accent text-bg font-semibold rounded hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}
