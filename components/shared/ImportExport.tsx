'use client';

import { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Loader2, File, X } from 'lucide-react';

interface ImportResult {
  imported: number;
  errors: string[];
  total: number;
}

type ExportDataType = 'advisors' | 'deals' | 'all';
type ExportFormat = 'csv' | 'json';

export function ImportExport() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [exportType, setExportType] = useState<ExportDataType>('advisors');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exporting, setExporting] = useState(false);

  // Import handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setImportFile(files[0]);
      setImportError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      setImportFile(files[0]);
      setImportError(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportError('Please select a file');
      return;
    }

    try {
      setImporting(true);
      setImportError(null);

      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/live/import', {
        method: 'POST',
        body: formData,
      });

      const data: ImportResult = await res.json();

      if (!res.ok) {
        setImportError((data as any).error || 'Failed to import');
        return;
      }

      setImportResult(data);
      setImportFile(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/advisor-import-template.csv';
    link.download = 'advisor-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export handlers
  const handleExport = async () => {
    try {
      setExporting(true);
      const url = `/api/live/export?type=${exportType}&format=${exportFormat}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error('Failed to export');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `export_${exportType}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-tcs-border">
        {(['import', 'export'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setImportResult(null);
              setImportError(null);
              setImportFile(null);
            }}
            className={`px-4 py-3 text-sm font-medium uppercase transition-colors ${
              activeTab === tab
                ? 'text-tcs-teal border-b-2 border-tcs-teal'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'import' ? 'Import Advisors' : 'Export Data'}
          </button>
        ))}
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-4">
          {/* Template Download */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 mb-2">
              Start by downloading our template to see the correct format.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Download Template
            </button>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-tcs-border rounded-lg p-8 text-center hover:border-tcs-teal transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-700">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">CSV files only, max 10 MB</p>
            {importFile && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-600">
                <File className="w-3 h-3" />
                {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!importFile || importing}
            className="w-full py-2 px-4 bg-tcs-teal text-white rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import File
              </>
            )}
          </button>

          {/* Error message */}
          {importError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{importError}</p>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Successfully imported {importResult.imported} of {importResult.total} advisors
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-medium text-yellow-900 mb-2">
                    {importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''}:
                  </p>
                  <ul className="text-xs text-yellow-800 space-y-1 max-h-[200px] overflow-y-auto">
                    {importResult.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          {/* Data Type Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">
              Data Type
            </label>
            <div className="space-y-2">
              {(['advisors', 'deals', 'all'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportType"
                    value={type}
                    checked={exportType === type}
                    onChange={(e) => setExportType(e.target.value as ExportDataType)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">
              Format
            </label>
            <div className="space-y-2">
              {(['csv', 'json'] as const).map((format) => (
                <label key={format} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format}
                    checked={exportFormat === format}
                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 uppercase">{format}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-2 px-4 bg-tcs-teal text-white rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </button>

          <p className="text-xs text-gray-600 text-center">
            Download your data as {exportFormat.toUpperCase()} for backup or external use
          </p>
        </div>
      )}
    </div>
  );
}
