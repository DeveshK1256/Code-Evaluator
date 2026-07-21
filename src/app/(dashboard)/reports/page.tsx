import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Export and download evaluation reports" />
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="No reports yet"
        description="Generated reports will appear here. You can export them as PDF, Markdown, JSON, or CSV."
      />
    </div>
  );
}
