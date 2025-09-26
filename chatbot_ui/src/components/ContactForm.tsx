'use client';

import { useState, useEffect } from 'react';

import { SessionSelections } from '@/types';

interface ContactFormProps {
  generateContactMessage: () => string;
  onSelection: (selections: SessionSelections) => void;
}

export default function ContactForm({ generateContactMessage, onSelection }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    note: ''
  });

  useEffect(() => {
    // Pre-fill the note field with generated message
    const message = generateContactMessage();
    setFormData(prev => ({ ...prev, note: message }));
  }, [generateContactMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelection({ contact: formData });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-2">
      <div className="inline-block text-xs px-2 py-1 border border-border rounded-full text-muted">
        Share your contact details
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="px-2 py-1 rounded border border-border bg-bg text-text"
              placeholder="Your name"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="px-2 py-1 rounded border border-border bg-bg text-text"
              placeholder="your@email.com"
            />
          </div>
          
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-muted">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="px-2 py-1 rounded border border-border bg-bg text-text"
              placeholder="Your company"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Message (ready to send)</label>
          <textarea
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            rows={4}
            className="px-2 py-1 rounded border border-border bg-bg text-text resize-none"
            placeholder="Your message will be generated based on your selections..."
          />
        </div>
        
        <button
          type="submit"
          className="px-3 py-2 bg-accent text-bg font-semibold rounded hover:bg-accent-600 transition-colors"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
