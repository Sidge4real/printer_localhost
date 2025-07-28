import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "./FileUpload";
import { DocumentPreview } from "./DocumentPreview";
import { PrinterSettings } from "./PrinterSettings";
import { DocumentMetadata } from "./DocumentMetadata";
import { Printer, X, Loader2 } from "lucide-react";
import { printDocument } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface Document {
  name: string;
  size: number;
  pages: number;
  type: 'pdf' | 'docx';
  content?: string; // Base64 or URL for preview
}

interface PrintSettings {
  printer: string;
  copies: number;
  pageRange: string;
  colorMode: 'color' | 'blackwhite';
  doubleSided: boolean;
  paperSize: string;
}

export function PrinterInterface() {
  const { toast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    printer: 'Microsoft Print to PDF',
    copies: 1,
    pageRange: 'all',
    colorMode: 'color',
    doubleSided: false,
    paperSize: 'A4'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleFileSelect = (file: File) => {
    // Create document metadata
    const document: Document = {
      name: file.name,
      size: file.size,
      pages: Math.floor(Math.random() * 10) + 1, // Simulate page count since we can't easily determine this
      type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx'
    };
    setSelectedDocument(document);
    setSelectedFile(file);
    setCurrentPage(1);
  };

  const handlePrint = async () => {
    if (!selectedDocument || !selectedFile) return;
    
    setIsPrinting(true);
    try {
      const result = await printDocument(selectedFile, printSettings);
      toast({
        title: "Print job sent",
        description: `${selectedDocument.name} has been sent to ${printSettings.printer}`,
        variant: "default",
      });
      // Clear the document after successful print
      handleCancel();
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print failed",
        description: error instanceof Error ? error.message : "Failed to send print job",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCancel = () => {
    setSelectedDocument(null);
    setSelectedFile(null);
    setCurrentPage(1);
    setZoom(100);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
            <Printer className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Print</h1>
            <p className="text-sm text-muted-foreground">Select a document and configure your print settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Panel - File Selection & Settings */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Select Document</h2>
              <FileUpload onFileSelect={handleFileSelect} />
            </Card>

            {selectedDocument && (
              <>
                <DocumentMetadata document={selectedDocument} />
                <PrinterSettings 
                  settings={printSettings}
                  onSettingsChange={setPrintSettings}
                />
              </>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="xl:col-span-2">
            <Card className="h-full min-h-[600px]">
              {selectedDocument ? (
                <DocumentPreview
                  document={selectedDocument}
                  currentPage={currentPage}
                  totalPages={selectedDocument.pages}
                  zoom={zoom}
                  onPageChange={setCurrentPage}
                  onZoomChange={setZoom}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Printer className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Document Selected</h3>
                    <p className="text-muted-foreground">Upload a PDF or Word document to see the preview</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        {selectedDocument && (
          <div className="mt-6">
            <Separator className="mb-6" />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Ready to print • {selectedDocument.pages} page{selectedDocument.pages !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-8"
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Printing...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Print
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}