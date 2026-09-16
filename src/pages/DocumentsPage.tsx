import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Upload,
  Trash2,
  Eye,
  RefreshCw,
  X,
} from 'lucide-react';
import { mockDocuments } from '../data/mockData';
import { Document, DocumentStatus, DocumentType } from '../types';

function StatusBadge({ status }: { status: Document['status'] }) {
  const styles = {
    pending: 'bg-neutral-100 text-neutral-600',
    processing: 'bg-primary-50 text-primary-700',
    completed: 'bg-success-50 text-success-600',
    failed: 'bg-danger-50 text-danger-600',
  };
  const labels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${styles[status]}`}>
      {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'failed' && <AlertCircle className="w-3 h-3" />}
      {labels[status]}
    </span>
  );
}

function DeleteConfirmation({ fileName, onConfirm, onCancel }: {
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-xl border border-neutral-200 p-6 max-w-sm w-full"
      >
        <h3 className="text-base font-semibold text-navy-900">Delete document</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Are you sure you want to delete <span className="font-medium">{fileName}</span>? This action cannot be undone.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-danger-500 hover:bg-danger-600 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [documents, setDocuments] = useState(mockDocuments);

  // Sync search query with URL
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.documentType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = () => {
    if (deleteTarget) {
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const handleRetry = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: 'processing' as const } : d))
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Documents</h1>
            <p className="text-sm text-neutral-500 mt-1">{documents.length} documents total</p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload new
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
                className="pl-9 pr-8 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentType | 'all')}
              className="px-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            >
              <option value="all">All types</option>
              <option value="resume">Resume</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {/* Documents table - Desktop */}
        <div className="hidden lg:block bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">File name</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Uploaded</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Readability</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">AI Score</th>
                <th className="text-right px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-navy-900">No documents found</p>
                    <p className="text-xs text-neutral-500 mt-1">Try adjusting your filters or upload a new document.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-neutral-500" />
                        </div>
                        <span className="text-sm font-medium text-navy-900 truncate max-w-[220px]">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-neutral-600 capitalize">{doc.documentType}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-neutral-500">
                        {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {doc.readabilityScore !== null ? (
                        <span className="text-sm font-medium text-navy-900">{doc.readabilityScore}</span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {doc.aiScore !== null ? (
                        <span className="text-sm font-medium text-navy-900">{doc.aiScore}%</span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {doc.status === 'completed' && (
                          <Link
                            to={`/analysis/${doc.id}`}
                            className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                            title="View analysis"
                          >
                            <Eye className="w-4 h-4 text-neutral-500" />
                          </Link>
                        )}
                        {doc.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(doc.id)}
                            className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                            title="Retry processing"
                          >
                            <RefreshCw className="w-4 h-4 text-neutral-500" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="p-1.5 rounded-md hover:bg-danger-50 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4 text-neutral-400 hover:text-danger-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Documents cards - Mobile */}
        <div className="lg:hidden space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
              <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-navy-900">No documents found</p>
              <p className="text-xs text-neutral-500 mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4.5 h-4.5 text-neutral-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy-900 truncate">{doc.fileName}</p>
                      <p className="text-xs text-neutral-500">
                        {doc.documentType} • {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-neutral-500">
                      Readability: <span className="font-medium text-navy-900">{doc.readabilityScore ?? '—'}</span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      AI: <span className="font-medium text-navy-900">{doc.aiScore !== null ? `${doc.aiScore}%` : '—'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.status === 'completed' && (
                      <Link to={`/analysis/${doc.id}`} className="p-1.5 rounded-md hover:bg-neutral-100">
                        <Eye className="w-4 h-4 text-neutral-500" />
                      </Link>
                    )}
                    {doc.status === 'failed' && (
                      <button onClick={() => handleRetry(doc.id)} className="p-1.5 rounded-md hover:bg-neutral-100">
                        <RefreshCw className="w-4 h-4 text-neutral-500" />
                      </button>
                    )}
                    <button onClick={() => setDeleteTarget(doc)} className="p-1.5 rounded-md hover:bg-danger-50">
                      <Trash2 className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirmation
          fileName={deleteTarget.fileName}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
