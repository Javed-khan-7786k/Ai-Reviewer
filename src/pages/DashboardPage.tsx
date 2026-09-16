import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Loader2,
  Upload,
  ArrowRight,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { mockDocuments, mockUsage } from '../data/mockData';
import { Document } from '../types';

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
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${styles[status]}`}>
      {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
      {labels[status]}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, sublabel, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
      {sublabel && <p className="text-[11px] text-neutral-400 mt-1">{sublabel}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const recentDocs = mockDocuments.slice(0, 4);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-navy-900">Welcome back, Alex</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Upload a document to get started with AI-powered analysis.
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Upload a document
        </Link>
      </motion.div>

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <MetricCard
          icon={FileText}
          label="Total documents"
          value={mockUsage.totalDocuments}
          color="bg-navy-50 text-navy-700"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completed analyses"
          value={mockUsage.completedAnalyses}
          color="bg-success-50 text-success-600"
        />
        <MetricCard
          icon={Loader2}
          label="Processing"
          value={mockUsage.processingDocuments}
          color="bg-primary-50 text-primary-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="Today's usage"
          value={`${mockUsage.documentsProcessed}/${mockUsage.dailyLimit}`}
          sublabel="Free plan limit"
          color="bg-warning-50 text-warning-600"
        />
      </motion.div>

      {/* Recent documents */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-navy-900">Recent documents</h2>
          </div>
          <Link
            to="/documents"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">File name</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Readability</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">AI Score</th>
                <th className="text-right px-5 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-neutral-500" />
                      </div>
                      <span className="text-sm font-medium text-navy-900 truncate max-w-[200px]">{doc.fileName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-neutral-600 capitalize">{doc.documentType}</span>
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
                  <td className="px-5 py-3.5 text-right">
                    {doc.status === 'completed' && (
                      <Link
                        to={`/analysis/${doc.id}`}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        View analysis
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-neutral-100">
          {recentDocs.map((doc) => (
            <div key={doc.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{doc.fileName}</p>
                    <p className="text-xs text-neutral-500 capitalize">{doc.documentType}</p>
                  </div>
                </div>
                <StatusBadge status={doc.status} />
              </div>
              {doc.status === 'completed' && (
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-xs text-neutral-500">Readability: <span className="font-medium text-navy-900">{doc.readabilityScore}</span></span>
                  <span className="text-xs text-neutral-500">AI: <span className="font-medium text-navy-900">{doc.aiScore}%</span></span>
                  <Link
                    to={`/analysis/${doc.id}`}
                    className="ml-auto text-xs font-medium text-primary-600"
                  >
                    View →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
