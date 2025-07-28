import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Please select a PDF or Word document (.pdf, .docx, .doc)');
      return false;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size must be less than 50MB');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50",
          error && "border-destructive"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            dragActive ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {dragActive ? (
              <Upload className="w-6 h-6" />
            ) : (
              <FileText className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Drop your document here, or 
              <button 
                className="text-primary hover:text-primary/80 ml-1"
                onClick={() => fileInputRef.current?.click()}
              >
                browse files
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF and Word documents (max 50MB)
            </p>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <Button 
        variant="outline" 
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        Choose File
      </Button>
    </div>
  );
}