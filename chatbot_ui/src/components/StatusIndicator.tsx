'use client';

import { useState, useEffect } from 'react';

export default function StatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [details, setDetails] = useState<string>('Checking backend...');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setStatus('connected');
          setDetails('Backend connected');
        } else {
          setStatus('error');
          setDetails('Backend error');
        }
      } catch {
        setStatus('error');
        setDetails('Backend offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-accent';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-muted';
    }
  };

  return (
    <div className={`text-xs ${getStatusColor()}`}>
      {details}
    </div>
  );
}
