import { useMemo, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Download, Ban, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFiles } from '@/lib/file-context';
import { formatFileSize, getFileIcon, getTimeRemaining } from '@/lib/mock-data';
import { toast } from 'sonner';
import { fileAPI } from '@/services/api';

export default function FileAccessPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { files, updateFile, addActivity } = useFiles();
  const [isDownloading, setIsDownloading] = useState(false);

  // Step 1: Fetch file by fileId ONLY (do not use token for lookup)
  const file = useMemo(() => files.find(f => f.id === fileId), [files, fileId]);

  // Step 2: Validate token and file status
  const accessStatus = useMemo(() => {
    if (!file) return { allowed: false, reason: 'File not found', statusCode: 404 };
    
    // Log all access attempts
    const logAttempt = (eventType: 'download_success' | 'download_blocked' | 'access_attempt', details: string) => {
      addActivity({
        id: crypto.randomUUID(),
        fileId: file.id,
        timestamp: new Date().toISOString(),
        eventType,
        status: eventType === 'download_success' ? 'success' : 'blocked',
        details,
      });
    };

    // Validate: token matches file.accessToken
    if (!token || token !== file.accessToken) {
      logAttempt('download_blocked', 'Access blocked – Invalid token');
      return { allowed: false, reason: 'Invalid access token', statusCode: 403 };
    }

    // Validate: file.status === "active"
    if (file.status === 'revoked') {
      logAttempt('download_blocked', 'Access blocked – Link revoked');
      return { allowed: false, reason: 'This link has been revoked', statusCode: 403 };
    }

    // Validate: Token not expired
    if (new Date(file.expiryTimestamp).getTime() < Date.now()) {
      logAttempt('download_blocked', 'Access blocked – Token expired');
      return { allowed: false, reason: 'This link has expired', statusCode: 403 };
    }

    // Validate: usedDownloads < maxDownloads
    if (file.maxDownloads > 0 && file.usedDownloads >= file.maxDownloads) {
      logAttempt('download_blocked', 'Access blocked – Download limit reached');
      return { allowed: false, reason: 'Download limit reached', statusCode: 403 };
    }

    logAttempt('access_attempt', 'Token validated successfully');
    return { allowed: true, reason: 'Access granted', statusCode: 200 };
  }, [file, token, addActivity]);

  const handleDownload = async () => {
    if (!file || !accessStatus.allowed || !token) return;
    
    setIsDownloading(true);
    
    try {
      // Call the API to download the file
      const response = await fileAPI.downloadFileByToken(token);
      
      // Create a blob from the response and trigger download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Update the local file state to reflect the incremented download count
      updateFile(file.id, { usedDownloads: file.usedDownloads + 1 });
      
      // Note: Activity logging is already handled by the API
      
      toast.success('Download complete', { description: file.name });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again later.';
      toast.error('Download failed', { description: errorMessage });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">VaultDrop</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 card-shadow">
          {accessStatus.statusCode === 404 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-warning" />
              <h2 className="text-lg font-semibold text-foreground">File Not Found</h2>
              <p className="text-sm text-muted-foreground mt-1">This file may have been removed or the link is incorrect.</p>
            </div>
          ) : accessStatus.statusCode === 403 ? (
            <div className="text-center py-8">
              <Ban className="w-12 h-12 mx-auto mb-3 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
              <p className="text-sm text-muted-foreground mt-2">{accessStatus.reason}</p>

              {file && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50 text-left space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
                <h2 className="text-lg font-semibold text-foreground">File Ready</h2>
                <p className="text-sm text-muted-foreground mt-1">Your file is available for download.</p>
              </div>

              {file && (
                <>
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(file.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {getTimeRemaining(file.expiryTimestamp)} left
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {file.maxDownloads === 0
                          ? `${file.usedDownloads} downloads`
                          : `${file.usedDownloads} / ${file.maxDownloads}`}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleDownload} disabled={isDownloading}>
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading ? 'Downloading...' : 'Download File'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    This is a secure link. Do not share with unauthorized parties.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
