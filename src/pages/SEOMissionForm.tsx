import React, { useState, useEffect, useRef } from 'react';
import { ChatIcon, SettingsIcon } from '../components/icons';
import LoadingDog from '../components/LoadingDog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://agent-store-backend.vercel.app');
console.log('🔍 SEO API_BASE_URL:', API_BASE_URL);

interface JobStatus {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  result?: any;
  error?: string;
  completedAt?: string;
}

export default function SEOMissionForm({ badgeLabel }: { badgeLabel: string; agentId: string }) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'processing' | 'completed' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pdfLink, setPdfLink] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/seo/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const job: JobStatus = await response.json();
      
      if (job.status === 'completed' && job.result) {
        // Extract File_url from the result
        let fileUrl = null;
        if (job.result.reply && Array.isArray(job.result.reply) && job.result.reply[0]) {
          fileUrl = job.result.reply[0].File_url;
        }
        
        if (fileUrl) {
          setPdfLink(fileUrl);
          setStatus('completed');
        } else {
          setStatus('failed');
          setErrorMsg('No file URL received in SEO audit result');
        }
        
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      } else if (job.status === 'failed') {
        setStatus('failed');
        setErrorMsg(job.error || 'SEO audit failed');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }
      // Continue polling if still processing
      
    } catch (error) {
      console.error('Polling error:', error);
      // Don't stop polling on network errors, just log them
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setStatus('starting');
      setErrorMsg(null);
      setPdfLink(null);
      setJobId(null);
      
      // Start SEO audit via backend
      const response = await fetch(`${API_BASE_URL}/api/seo/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: websiteUrl,
          website_url: websiteUrl // Send both formats for compatibility
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      setJobId(result.job_id);
      setStatus('processing');
      
      // Start polling for results every 5 seconds
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(result.job_id);
      }, 5000);
      
      // Also poll immediately
      setTimeout(() => pollJobStatus(result.job_id), 1000);
      
    } catch (err: unknown) {
      setStatus('failed');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start SEO audit');
    }
  };

  return (
    <main className="relative w-full h-full overflow-hidden bg-background rounded-xl">
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between w-full gap-5 p-3 border-b h-[60px]">
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 rounded-full flex gap-2 items-center text-xs leading-none border bg-rose-50 border-rose-100">
              <ChatIcon size={16} />
              <span>{badgeLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground">
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>

        <div className="p-4 space-y-3">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Website URL</label>
              <input 
                value={websiteUrl} 
                onChange={(e) => setWebsiteUrl(e.target.value)} 
                placeholder="https://example.com" 
                className="w-full border rounded-md px-3 py-2 bg-card" 
                required
              />
            </div>
            <button 
              type="submit" 
              className="inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" 
              disabled={status === 'starting' || status === 'processing'}
            >
              {status === 'starting' ? 'Starting...' : 
               status === 'processing' ? 'Auditing...' : 
               'Run SEO Audit'}
            </button>
          </form>

          {(status === 'starting' || status === 'processing') && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <LoadingDog />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    {status === 'starting' ? 'Starting SEO Audit...' : 'SEO Audit in Progress'}
                  </p>
                  <p className="text-sm text-blue-700">
                    {status === 'starting' ? 
                      'Initializing your comprehensive SEO analysis...' :
                      'Analyzing your website\'s SEO performance... This takes about 3 minutes.'
                    }
                  </p>
                  {jobId && (
                    <p className="text-xs text-blue-600 mt-1">Job ID: {jobId}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg">
              <p className="text-sm font-medium">SEO Audit Failed</p>
              <p className="text-sm">{errorMsg}</p>
              {jobId && (
                <p className="text-xs text-red-600 mt-1">Job ID: {jobId}</p>
              )}
            </div>
          )}

          {status === 'completed' && pdfLink && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">SEO Audit Complete! 🎉</h3>
              <p className="text-sm text-green-700 mb-3">
                Your comprehensive SEO audit report has been generated and is ready for download.
              </p>
              <div className="flex gap-2 flex-wrap">
                <a 
                  href={pdfLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  📄 View SEO Report
                </a>
                <button 
                  onClick={() => navigator.clipboard.writeText(pdfLink)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  📋 Copy Link
                </button>
              </div>
              <div className="mt-3 p-2 bg-white rounded border">
                <p className="text-xs text-gray-600 break-all">
                  {pdfLink}
                </p>
              </div>
              {jobId && (
                <p className="text-xs text-green-600 mt-2">Job ID: {jobId}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}