import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  FileText
} from "lucide-react";

interface Document {
  name: string;
  size: number;
  pages: number;
  type: 'pdf' | 'docx';
  content?: string;
}

interface DocumentPreviewProps {
  document: Document;
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
}

export function DocumentPreview({
  document,
  currentPage,
  totalPages,
  zoom,
  onPageChange,
  onZoomChange
}: DocumentPreviewProps) {
  const zoomLevels = [50, 75, 100, 125, 150, 200];

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      onZoomChange(zoomLevels[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      onZoomChange(zoomLevels[currentIndex - 1]);
    }
  };

  const resetZoom = () => onZoomChange(100);

  return (
    <div className="h-full flex flex-col">
      {/* Preview Header */}
      <div className="p-4 border-b bg-printer-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground">Preview</h3>
            <Badge variant="secondary" className="text-xs">
              {document.type.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= zoomLevels[0]}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetZoom}
              className="min-w-[60px]"
            >
              {zoom}%
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Page Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-printer-preview p-8 overflow-auto">
        <div className="flex justify-center">
          <div 
            className="bg-card shadow-lg border border-printer-border transition-transform"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              width: '595px', // A4 width at 96 DPI
              minHeight: '842px', // A4 height at 96 DPI
              marginBottom: `${100 - zoom}px` // Adjust margin based on zoom
            }}
          >
            {/* Simulated Document Content */}
            <div className="p-12 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{document.name}</h4>
                  <p className="text-sm text-muted-foreground">Page {currentPage}</p>
                </div>
              </div>
              
              {/* Sample content lines */}
              <div className="space-y-4">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-4/5" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
              
              {/* Page footer */}
              <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                <span>{document.name}</span>
                <span>{currentPage}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}