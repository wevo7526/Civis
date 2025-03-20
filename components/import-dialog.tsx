import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Papa from 'papaparse';

interface ImportField {
  key: string;
  label: string;
  required?: boolean;
}

interface ImportDialogProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: T[]) => void;
  template: T;
  fields: ImportField[];
}

export function ImportDialog<T>({ isOpen, onClose, onImport, template, fields }: ImportDialogProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<T[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          return;
        }

        const fileHeaders = results.meta.fields || [];
        setHeaders(fileHeaders);

        // Create initial mappings
        const initialMappings: Record<string, string> = {};
        fields.forEach(field => {
          const matchingHeader = fileHeaders.find(
            header => header.toLowerCase() === field.key.toLowerCase()
          );
          if (matchingHeader) {
            initialMappings[field.key] = matchingHeader;
          }
        });
        setMappings(initialMappings);

        // Generate preview
        const previewData = results.data.slice(0, 5).map(row => {
          const mappedRow = { ...template };
          Object.entries(initialMappings).forEach(([key, header]) => {
            const value = (row as Record<string, string>)[header];
            if (value) {
              if (key === 'skills' || key === 'interests') {
                (mappedRow as any)[key] = value.split(',').map(item => item.trim());
              } else if (key === 'availability') {
                (mappedRow as any)[key] = {
                  weekdays: value.toLowerCase().includes('weekday'),
                  weekends: value.toLowerCase().includes('weekend'),
                  hours: value
                };
              } else {
                (mappedRow as any)[key] = value;
              }
            }
          });
          return mappedRow;
        });
        setPreview(previewData);
      }
    });
  };

  const handleImport = () => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          return;
        }

        const importedData = results.data.map(row => {
          const mappedRow = { ...template };
          Object.entries(mappings).forEach(([key, header]) => {
            const value = (row as Record<string, string>)[header];
            if (value) {
              if (key === 'skills' || key === 'interests') {
                (mappedRow as any)[key] = value.split(',').map(item => item.trim());
              } else if (key === 'availability') {
                (mappedRow as any)[key] = {
                  weekdays: value.toLowerCase().includes('weekday'),
                  weekends: value.toLowerCase().includes('weekend'),
                  hours: value
                };
              } else {
                (mappedRow as any)[key] = value;
              }
            }
          });
          return mappedRow;
        });

        onImport(importedData);
      }
    });
  };

  const downloadTemplate = () => {
    const headers = fields.map(field => field.label).join(',');
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'volunteer_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Volunteers</h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label htmlFor="file">Upload CSV File</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Please ensure your CSV file has headers matching the required fields.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                  >
                    Download Template
                  </Button>
                </div>

                <input
                  type="file"
                  id="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-purple-50 file:text-purple-700
                    hover:file:bg-purple-100"
                />
              </div>

              {headers.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Map Fields</h3>
                  <div className="space-y-4">
                    {fields.map(field => (
                      <div key={field.key} className="flex items-center space-x-4">
                        <Label className="w-1/3">{field.label}</Label>
                        <select
                          value={mappings[field.key] || ''}
                          onChange={(e) => setMappings(prev => ({
                            ...prev,
                            [field.key]: e.target.value
                          }))}
                          className="w-2/3 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select column</option>
                          {headers.map(header => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preview.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {fields.map(field => (
                            <th
                              key={field.key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.map((row, index) => (
                          <tr key={index}>
                            {fields.map(field => (
                              <td
                                key={field.key}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {Array.isArray((row as any)[field.key])
                                  ? (row as any)[field.key].join(', ')
                                  : (row as any)[field.key]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!file || Object.keys(mappings).length === 0}
                  onClick={handleImport}
                >
                  Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 