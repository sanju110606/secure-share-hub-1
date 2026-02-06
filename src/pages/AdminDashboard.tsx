import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Link2, AlertTriangle, Users, FileText, Download, Ban, RefreshCw, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAdmin } from '@/lib/admin-context';
import StatsCard from '@/components/file-sharing/StatsCard';
import RiskBadge from '@/components/file-sharing/RiskBadge';
import ActivityTimeline from '@/components/file-sharing/ActivityTimeline';
import { formatFileSize, formatTimeAgo, getTimeRemaining, calculateRisk, exportToCSV } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { stats, allFiles, allActivity, deleteFile } = useAdmin();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const highRiskFiles = useMemo(
    () => allFiles.filter(f => calculateRisk(f) === 'high' && f.status === 'active'),
    [allFiles]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === allFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFiles.map(f => f.id)));
    }
  };

  const handleBulkRevoke = async () => {
    if (selectedIds.size === 0) return;
    try {
      // Revoke allFiles by deleting them (admin can delete any file)
      await Promise.all(Array.from(selectedIds).map(id => deleteFile(id)));
      toast.success(`${selectedIds.size} allFiles removed`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error('Failed to revoke allFiles');
    }
  };

  const handleExportLogs = () => {
    const data = allActivity.map(e => ({
      timestamp: new Date(e.timestamp).toISOString(),
      fileId: e.fileId,
      eventType: e.eventType,
      status: e.status,
      details: e.details,
    }));
    exportToCSV(data, `audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Audit log exported');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage all shared allFiles across the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard title="Users" value={stats?.totalUsers || 0} icon={Users} variant="primary" />
        <StatsCard title="Files" value={stats?.totalFiles || 0} icon={FileText} variant="default" />
        <StatsCard title="Active Links" value={stats?.activeLinks || 0} icon={Link2} variant="success" />
        <StatsCard title="Expired" value={stats?.expiredLinks || 0} icon={Shield} variant="warning" />
        <StatsCard title="Downloads" value={stats?.totalDownloads || 0} icon={Download} variant="primary" />
        <StatsCard title="Blocked" value={stats?.blockedAttempts || 0} icon={Ban} variant="destructive" />
      </div>

      {/* High Risk Alert */}
      {highRiskFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-foreground">High Risk Files ({highRiskFiles.length})</h3>
          </div>
          <div className="space-y-2">
            {highRiskFiles.slice(0, 3).map(file => (
              <div key={file.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
                  <RiskBadge level="high" />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive text-xs"
                  onClick={async () => {
                    try {
                      await deleteFile(file.id);
                      toast.success('File removed');
                    } catch (error) {
                      toast.error('Failed to remove file');
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bulk Actions & File Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">All Files</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkRevoke}
              disabled={selectedIds.size === 0}
              className="text-xs"
            >
              <Ban className="w-3.5 h-3.5 mr-1.5" />
              Remove Selected ({selectedIds.size})
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportLogs} className="text-xs">
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              Export Logs
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden card-shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left w-10">
                  <Checkbox
                    checked={selectedIds.size === allFiles.length && allFiles.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">File</th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Owner</th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Expiry</th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Downloads</th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk</th>
                <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {allFiles.map((file, i) => {
                const isExpired = new Date(file.expiryTimestamp).getTime() < Date.now();
                return (
                  <motion.tr
                    key={file.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.has(file.id)}
                        onCheckedChange={() => toggleSelect(file.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{file.uploadedByName}</span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className={`text-sm ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {getTimeRemaining(file.expiryTimestamp)}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {file.usedDownloads}{file.maxDownloads > 0 ? ` / ${file.maxDownloads}` : ' (∞)'}
                      </span>
                    </td>
                    <td className="p-3">
                      <RiskBadge level={calculateRisk(file)} />
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                        file.status === 'revoked'
                          ? 'bg-destructive/10 text-destructive'
                          : isExpired
                            ? 'bg-warning/10 text-warning'
                            : 'bg-success/10 text-success'
                      }`}>
                        {file.status === 'revoked' ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Audit Log</h2>
        </div>
        <div className="rounded-xl border bg-card card-shadow">
          <ActivityTimeline events={allActivity.slice(0, 10)} showFileId />
        </div>
      </div>
    </div>
  );
}
