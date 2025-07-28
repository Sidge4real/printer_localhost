import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Printer, Palette, Copy, FileText, Loader2 } from "lucide-react";
import { fetchPrinters } from "@/lib/api";

interface PrintSettings {
  printer: string;
  copies: number;
  pageRange: string;
  colorMode: 'color' | 'blackwhite';
  doubleSided: boolean;
  paperSize: string;
}

interface PrinterSettingsProps {
  settings: PrintSettings;
  onSettingsChange: (settings: PrintSettings) => void;
}

export function PrinterSettings({ settings, onSettingsChange }: PrinterSettingsProps) {
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getPrinters = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const printers = await fetchPrinters();
        setAvailablePrinters(printers.length > 0 ? printers : ['Microsoft Print to PDF']);
        
        // If we have printers and the current selection isn't in the list, update it
        if (printers.length > 0 && !printers.includes(settings.printer)) {
          updateSetting('printer', printers[0]);
        }
      } catch (err) {
        console.error('Failed to fetch printers:', err);
        setError('Failed to load printers');
        setAvailablePrinters(['Microsoft Print to PDF']);
      } finally {
        setIsLoading(false);
      }
    };

    getPrinters();
  }, []);

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const paperSizes = ['A4', 'A3', 'Letter', 'Legal', 'A5'];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Printer className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Print Settings</h2>
      </div>

      {/* Printer Selection */}
      <div className="space-y-2">
        <Label htmlFor="printer" className="text-sm font-medium">Printer</Label>
        <Select 
          value={settings.printer} 
          onValueChange={(value) => updateSetting('printer', value)}
          disabled={isLoading}
        >
          <SelectTrigger id="printer">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading printers...</span>
              </div>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            {availablePrinters.map((printer) => (
              <SelectItem key={printer} value={printer}>
                {printer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>

      <Separator />

      {/* Copies */}
      <div className="space-y-2">
        <Label htmlFor="copies" className="text-sm font-medium flex items-center gap-2">
          <Copy className="w-4 h-4" />
          Number of copies
        </Label>
        <Input
          id="copies"
          type="number"
          min="1"
          max="999"
          value={settings.copies}
          onChange={(e) => updateSetting('copies', parseInt(e.target.value) || 1)}
          className="w-24"
        />
      </div>

      {/* Page Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Page range
        </Label>
        <RadioGroup 
          value={settings.pageRange} 
          onValueChange={(value) => updateSetting('pageRange', value)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="text-sm">All pages</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="current" id="current" />
            <Label htmlFor="current" className="text-sm">Current page</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom" className="text-sm">Custom range</Label>
          </div>
        </RadioGroup>
        
        {settings.pageRange === 'custom' && (
          <Input
            placeholder="e.g., 1-5, 8, 11-13"
            className="mt-2"
          />
        )}
      </div>

      <Separator />

      {/* Color Mode */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Color mode
        </Label>
        <RadioGroup 
          value={settings.colorMode} 
          onValueChange={(value: 'color' | 'blackwhite') => updateSetting('colorMode', value)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="color" id="color" />
            <Label htmlFor="color" className="text-sm">Color</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="blackwhite" id="blackwhite" />
            <Label htmlFor="blackwhite" className="text-sm">Black & white</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Double-sided */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="double-sided" className="text-sm font-medium">Double-sided printing</Label>
          <p className="text-xs text-muted-foreground">Print on both sides of the paper</p>
        </div>
        <Switch
          id="double-sided"
          checked={settings.doubleSided}
          onCheckedChange={(checked) => updateSetting('doubleSided', checked)}
        />
      </div>

      <Separator />

      {/* Paper Size */}
      <div className="space-y-2">
        <Label htmlFor="paper-size" className="text-sm font-medium">Paper size</Label>
        <Select value={settings.paperSize} onValueChange={(value) => updateSetting('paperSize', value)}>
          <SelectTrigger id="paper-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paperSizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}