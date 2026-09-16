import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  Loader2,
  ArrowRight,
  File,
} from 'lucide-react';

type UploadState = 'idle' | 'dragging' | 'selected' | 'validating' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];

export default function UploadPage() {
  const [state, setState] = useState<UploadState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const validateFile = useCallback((f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return 'Unsupported file format. Please upload a PDF or DOCX file.';
    }
    if (!ACCEPTED_TYPES.includes(f.type) && f.type !== '') {
      return 'Invalid file type. Please upload a PDF or DOCX file.';
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }
    if (f.size === 0) {
      return 'File appears to be empty.';
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((f: File) => {
    setError(null);
    setState('validating');
    
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setState('idle');
      return;
    }

    setFile(f);
    setState('selected');
  }, [validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    setFile(null);
    setError(null);
    setProgress(0);
    setState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (!file) return;
    
    setState('uploading');
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setState('processing');
          // Simulate processing
          setTimeout(() => {
            setState('completed');
          }, 2000);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  }, [file]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-900">Upload a document</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Upload a PDF or DOCX file to receive AI-powered analysis and feedback.
          </p>
        </div>

        {/* Upload zone */}
        <AnimatePresence mode="wait">
          {(state === 'idle' || state === 'dragging') && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200
                  ${state === 'dragging'
                    ? 'border-primary-400 bg-primary-50 scale-[1.01]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                  }
                `}
                role="button"
                tabIndex={0}
                aria-label="Upload document"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleInputChange}
                  className="hidden"
                  aria-hidden="true"
                />
                
                <motion.div
                  animate={state === 'dragging' ? { scale: 1.1 } : { scale: 1 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100 mb-4"
                >
                  <Upload className={`w-6 h-6 ${state === 'dragging' ? 'text-primary-600' : 'text-neutral-400'}`} />
                </motion.div>

                <p className="text-sm font-medium text-navy-900">
                  {state === 'dragging' ? 'Drop your file here' : 'Drag and drop your document here'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">or click to browse files</p>
                
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-neutral-100 text-neutral-600 rounded">PDF</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-neutral-100 text-neutral-600 rounded">DOCX</span>
                  <span className="text-[10px] text-neutral-400">• Max 10MB</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* File selected */}
          {state === 'selected' && file && (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-neutral-200 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <File className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900 truncate">{file.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={handleRemove}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleRemove}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload and analyze
                </button>
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 bg-danger-50 border border-danger-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger-600">{error}</p>
                <button
                  onClick={handleRemove}
                  className="text-xs text-danger-500 hover:text-danger-600 mt-1 underline"
                >
                  Try a different file
                </button>
              </div>
            </motion.div>
          )}

          {/* Uploading */}
          {(state === 'uploading' || state === 'processing') && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-neutral-200 p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 mb-4">
                {state === 'uploading' ? (
                  <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                ) : (
                  <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                )}
              </div>
              <h3 className="text-base font-semibold text-navy-900">
                {state === 'uploading' ? 'Uploading document...' : 'Analyzing your document...'}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                {state === 'uploading'
                  ? 'Please wait while we securely upload your file.'
                  : 'Our AI is extracting text and running analysis. This usually takes a few seconds.'
                }
              </p>
              
              {state === 'uploading' && (
                <div className="mt-6 max-w-xs mx-auto">
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">{Math.min(Math.round(progress), 100)}%</p>
                </div>
              )}

              {state === 'processing' && (
                <div className="mt-6 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success-500" />
                    <span className="text-xs text-neutral-500">Uploaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    <span className="text-xs text-neutral-500">Processing</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Completed */}
          {state === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-neutral-200 p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success-50 mb-4">
                <Check className="w-6 h-6 text-success-600" />
              </div>
              <h3 className="text-base font-semibold text-navy-900">Analysis complete!</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Your document has been analyzed successfully. View the results below.
              </p>
              <button
                onClick={() => navigate('/analysis/doc-1')}
                className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
              >
                View analysis results
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info section */}
        <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
          <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider mb-2">What happens next?</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-xs text-neutral-600">
              <Check className="w-3.5 h-3.5 text-success-500 flex-shrink-0 mt-0.5" />
              Your document is stored privately and securely.
            </li>
            <li className="flex items-start gap-2 text-xs text-neutral-600">
              <Check className="w-3.5 h-3.5 text-success-500 flex-shrink-0 mt-0.5" />
              Text is extracted and analyzed for readability, keywords, and quality.
            </li>
            <li className="flex items-start gap-2 text-xs text-neutral-600">
              <Check className="w-3.5 h-3.5 text-success-500 flex-shrink-0 mt-0.5" />
              Optional AI-writing likelihood estimation is performed.
            </li>
            <li className="flex items-start gap-2 text-xs text-neutral-600">
              <Check className="w-3.5 h-3.5 text-success-500 flex-shrink-0 mt-0.5" />
              You can delete your document and all data at any time.
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
