import { useMemo } from 'react';
import { Files, Link2, ShieldCheck, AlertTriangle } from 'lucide-react';
import FileUpload from '@/components/file-sharing/FileUpload';
import FileCard from '@/components/file-sharing/FileCard';
import StatsCard from '@/components/file-sharing/StatsCard';
import { useFiles } from '@/lib/file-context';
import { useAuth } from '@/lib/auth-context';
import { calculateRisk } from '@/lib/mock-data';

export default function Index() {
  const { files } = useFiles();
  const { user } = useAuth();

  const userFiles = useMemo(() => files.filter(f => f.uploadedBy === user?.userId), [files, user?.userId]);
  const activeLinks = useMemo(() => userFiles.filter(f => f.status === 'active' && new Date(f.expiryTimestamp).getTime() > Date.now()), [userFiles]);
  const highRiskCount = useMemo(() => userFiles.filter(f => calculateRisk(f) === 'high' && f.status === 'active').length, [userFiles]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Files</h1>
        <p className="text-muted-foreground mt-1">Upload, share, and manage your files securely.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Files" value={userFiles.length} icon={Files} variant="default" />
        <StatsCard title="Active Links" value={activeLinks.length} icon={Link2} variant="success" />
        <StatsCard title="Secure Files" value={userFiles.length - highRiskCount} icon={ShieldCheck} variant="primary" />
        <StatsCard title="High Risk" value={highRiskCount} icon={AlertTriangle} variant={highRiskCount > 0 ? 'destructive' : 'default'} />
      </div>

      {/* Upload */}
      <div className="rounded-xl border bg-card p-6 card-shadow">
        <h2 className="text-base font-semibold text-foreground mb-4">Upload & Share</h2>
        <FileUpload />
      </div>

      {/* File List */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Shared Files</h2>
        <div className="grid gap-4">
          {userFiles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground rounded-xl border bg-card card-shadow">
              <Files className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No files uploaded yet. Start by uploading a file above.</p>
            </div>
          ) : (
            userFiles.map((file, index) => (
              <FileCard key={file.id} file={file} index={index} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
