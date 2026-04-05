"use client";

import { useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, DatabaseZap } from "lucide-react";

export default function SettingsPage() {
  const restoreFileRef = useRef<HTMLInputElement | null>(null);

  const handleBackup = async () => {
    try {
      const result = await apiClient.backupDatabase();
      if (result.success) {
        alert(`Backup saved at: ${result.absolute_path ?? result.file}`);
        return;
      }
      alert(result.message ?? "Backup failed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backup failed";
      alert(message);
    }
  };

  const handleRestore = async () => {
    const file = restoreFileRef.current?.files?.[0];
    if (!file) {
      alert("Choose a backup file first.");
      return;
    }

    if (!confirm("Restore database from selected file? Current data will be replaced.")) {
      return;
    }

    try {
      const result = await apiClient.restoreDatabase(file);
      alert(result.message ?? "Restore completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Restore failed";
      alert(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Database maintenance and recovery tools.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="w-5 h-5 text-primary" />
              Database Backup
            </CardTitle>
            <CardDescription>Create a backup snapshot (SQLite mode).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void handleBackup()} className="w-full">
              Create Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <DatabaseZap className="w-5 h-5" />
              Database Restore
            </CardTitle>
            <CardDescription>Upload backup file and restore the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input ref={restoreFileRef} type="file" accept=".sqlite,.db" className="w-full text-sm" />
            <Button variant="destructive" onClick={() => void handleRestore()} className="w-full">
              Restore Backup
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
