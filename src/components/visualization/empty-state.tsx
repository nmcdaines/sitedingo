import { FileQuestion, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onGenerateAI?: () => void;
  onCreateManual?: () => void;
}

export function EmptyState({
  title = "No sitemap created yet",
  description = "Get started by generating a sitemap using AI or create pages manually.",
  onGenerateAI,
  onCreateManual,
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[500px]">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <FileQuestion className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={onGenerateAI}
            className="gap-2 bg-gray-900 hover:bg-gray-800"
          >
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </Button>
          <Button
            onClick={onCreateManual}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Manually
          </Button>
        </div>
      </div>
    </div>
  );
}
