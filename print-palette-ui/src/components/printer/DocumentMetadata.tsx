import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, HardDrive, Hash } from "lucide-react";

interface Document {
  name: string;
  size: number;
  pages: number;
  type: 'pdf' | 'docx';
  content?: string;
}

interface DocumentMetadataProps {
  document: Document;
}

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'docx':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-foreground truncate" title={document.name}>
              {document.name}
            </h3>
            <Badge 
              variant="outline" 
              className={`text-xs ${getFileTypeColor(document.type)}`}
            >
              {document.type.toUpperCase()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                <span>{document.pages} page{document.pages !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                <span>{formatFileSize(document.size)}</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Ready for printing
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}