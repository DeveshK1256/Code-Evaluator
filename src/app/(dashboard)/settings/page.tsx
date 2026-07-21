"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { Separator } from "@/components/ui/separator";
import { useThemeStore } from "@/stores/theme-store";
import { Moon, Sun, Monitor } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Manage your account and preferences" />

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize your theme preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[
              { id: "light" as const, label: "Light", icon: Sun },
              { id: "dark" as const, label: "Dark", icon: Moon },
              { id: "system" as const, label: "System", icon: Monitor },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent min-w-[100px] ${
                    theme === option.id ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Default Evaluation Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Defaults</CardTitle>
          <CardDescription>Configure your default evaluation preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-profile">Default Evaluation Profile</Label>
            <Select defaultValue="balanced">
              <SelectTrigger id="default-profile" className="w-full sm:w-64">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google-solution-challenge">Google Solution Challenge</SelectItem>
                <SelectItem value="startup-mvp">Startup MVP</SelectItem>
                <SelectItem value="enterprise-audit">Enterprise Audit</SelectItem>
                <SelectItem value="academic-project">Academic Project</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="export-format">Default Export Format</Label>
            <Select defaultValue="pdf">
              <SelectTrigger id="export-format" className="w-full sm:w-64">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="md">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Control when and how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "analysis-complete", label: "Analysis Complete", desc: "When repository analysis finishes" },
            { id: "evaluation-complete", label: "Evaluation Complete", desc: "When evaluation results are ready" },
            { id: "export-ready", label: "Export Ready", desc: "When report export is complete" },
            { id: "upload-status", label: "Upload Status", desc: "When upload succeeds or fails" },
          ].map((notif) => (
            <div key={notif.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{notif.label}</p>
                <p className="text-xs text-muted-foreground">{notif.desc}</p>
              </div>
              <Switch defaultChecked aria-label={`Toggle ${notif.label}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSave}>
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
