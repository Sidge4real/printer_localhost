import axios from 'axios';

const API_URL = 'http://localhost:3001';

interface PrintSettings {
  printer: string;
  copies: number;
  pageRange: string;
  colorMode: 'color' | 'blackwhite';
  doubleSided: boolean;
  paperSize: string;
}

export const fetchPrinters = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${API_URL}/printers`);
    return response.data.printers || [];
  } catch (error) {
    console.error('Failed to fetch printers:', error);
    return [];
  }
}

export const printDocument = async (file: File, settings: PrintSettings) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Map frontend settings to backend expected format
  formData.append('printer', settings.printer);
  formData.append('copies', settings.copies.toString());
  formData.append('pageRange', settings.pageRange === 'custom' ? '' : settings.pageRange);
  formData.append('color', settings.colorMode === 'color' ? 'color' : 'mono');
  formData.append('duplex', settings.doubleSided.toString());
  formData.append('paperSize', settings.paperSize);
  
  try {
    const response = await axios.post(`${API_URL}/print`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Failed to print document');
    }
    throw error;
  }
};