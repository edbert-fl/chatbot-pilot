'use client';

import { useState, useEffect } from 'react';

interface SendMessageProps {
  generateContactMessage: () => string;
}

export default function SendMessage({ generateContactMessage }: SendMessageProps) {
  const [message, setMessage] = useState('');
  const [isEditable, setIsEditable] = useState(false);

  const handleGenerateMessage = () => {
    const generatedMessage = generateContactMessage();
    setMessage(generatedMessage);
  };

  const handleEdit = () => {
    setIsEditable(true);
  };

  const handleSend = () => {
    // Here you would typically send the message to your backend
    console.log('Sending message:', message);
    alert('Message sent! (This would integrate with your backend)');
  };

  // Generate message on component mount
  useEffect(() => {
    handleGenerateMessage();
  }, [generateContactMessage]);

  return (
    <div className="bg-panel border border-border rounded-lg p-4 my-3">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-accent m-0">Your Message:</h4>
        
        <div className="bg-bg border border-border rounded p-3">
          {isEditable ? (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-transparent text-text resize-none border-none outline-none"
              rows={4}
            />
          ) : (
            <div className="text-text whitespace-pre-wrap">{message}</div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="px-3 py-2 rounded border border-border bg-bg text-text hover:border-accent hover:text-accent transition-colors"
          >
            ✏️ Edit Message
          </button>
          <button
            onClick={handleSend}
            className="px-3 py-2 bg-accent text-bg font-semibold rounded hover:bg-accent-600 transition-colors"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
