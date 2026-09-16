import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Download,
  Trash2,
  BarChart3,
  Search,
  Sparkles,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Tag,
  Lightbulb,
  PenTool,
  X,
} from 'lucide-react';
import { mockAnalysis, mockDocuments } from '../data/mockData';
import { AnalysisParagraph } from '../types';

function AIGauge({ score }: { score: number | null }) {
  if (score === null) return null;
  
  const getColor = (s: number) => {
    if (s <= 20) return { stroke: '#22c55e', bg: 'bg-success-50', text: 'text-success-600', label: 'Likely human-written' };
    if (s <= 50) return { stroke: '#f59e0b', bg: 'bg-warning-50', text: 'text-warning-600', label: 'Mixed signals' };
    if (s <= 75) return { stroke: '#f97316', bg: 'bg-orange-50', text: 'text-orange-600', label: 'Possible AI patterns' };
    return { stroke: '#ef4444', bg: 'bg-danger-50', text: 'text-danger-600', label: 'Strong AI patterns' };
  };

  const color = getColor(score);
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={`${color.bg} rounded-xl p-5 border border-neutral-100`}>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e7e5e4" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={color.stroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-navy-900">{score}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-900">AI-Writing Likelihood</p>
          <p className={`text-xs font-medium ${color.text} mt-0.5`}>{color.label}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-neutral-500 leading-relaxed">
        This estimate is based on linguistic patterns and the selected detection provider. 
        It is not proof of authorship. Results may be inaccurate, especially for short, edited, 
        translated, or highly structured text.
      </p>
    </div>
  );
}

function ReadabilityCard({ score }: { score: number | null }) {
  if (score === null) return null;

  const getLevel = (s: number) => {
    if (s >= 80) return { label: 'Excellent', color: 'text-success-600' };
    if (s >= 60) return { label: 'Good', color: 'text-primary-600' };
    if (s >= 40) return { label: 'Fair', color: 'text-warning-600' };
    return { label: 'Needs work', color: 'text-danger-600' };
  };

  const level = getLevel(score);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Readability</span>
        <span className={`text-xs font-semibold ${level.color}`}>{level.label}</span>
      </div>
      <p className="text-3xl font-bold text-navy-900">{score}</p>
      <div className="mt-2 w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ParagraphHighlight({ paragraph, isSelected, onClick }: {
  paragraph: AnalysisParagraph;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getHighlightClass = (score: number | null) => {
    if (score === null) return '';
    if (score <= 20) return 'border-l-success-500 bg-success-50/50';
    if (score <= 50) return 'border-l-warning-500 bg-warning-50/50';
    if (score <= 75) return 'border-l-orange-500 bg-orange-50/50';
    return 'border-l-danger-500 bg-danger-50/50';
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg border-l-3 transition-all duration-200
        ${isSelected ? getHighlightClass(paragraph.aiScore) + ' ring-1 ring-primary-200' : 'hover:bg-neutral-50 border-l-transparent'}
      `}
    >
      <p className="text-sm text-navy-900 leading-relaxed">{paragraph.text}</p>
      {paragraph.aiScore !== null && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-neutral-400">AI score:</span>
          <span className={`text-[10px] font-medium ${
            paragraph.aiScore <= 20 ? 'text-success-600' :
            paragraph.aiScore <= 50 ? 'text-warning-600' :
            paragraph.aiScore <= 75 ? 'text-orange-600' : 'text-danger-600'
          }`}>
            {paragraph.aiScore}%
          </span>
        </div>
      )}
    </button>
  );
}

export default function AnalysisPage() {
  const { id } = useParams();
  const [selectedParagraph, setSelectedParagraph] = useState<AnalysisParagraph | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'suggestions'>('overview');
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const document = mockDocuments.find(d => d.id === id) || mockDocuments[0];
  const analysis = mockAnalysis;

  const filteredParagraphs = searchQuery
    ? analysis.paragraphs.filter(p => p.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : analysis.paragraphs;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 lg:px-6 py-4 border-b border-neutral-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/documents"
              className="flex-shrink-0 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Back to documents"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-600" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-navy-900 truncate">{document.fileName}</h1>
              <p className="text-xs text-neutral-500">
                {document.documentType} • Uploaded {new Date(document.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobilePanel(!showMobilePanel)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle analytics panel"
            >
              <BarChart3 className="w-4 h-4 text-neutral-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors" aria-label="Download">
              <Download className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document viewer - left/center */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 lg:p-8">
            {/* Summary section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <ReadabilityCard score={analysis.readabilityScore} />
                <AIGauge score={analysis.aiScore} />
              </div>

              {/* Summary text */}
              <div className="bg-white rounded-xl border border-neutral-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900">Summary</h3>
                    <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{analysis.summary}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Search within document */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search within document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>
            </div>

            {/* Document content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-xl border border-neutral-200 p-6 lg:p-8"
            >
              <div className="prose prose-sm max-w-none">
                <div className="space-y-1">
                  {filteredParagraphs.map((paragraph) => (
                    <ParagraphHighlight
                      key={paragraph.id}
                      paragraph={paragraph}
                      isSelected={selectedParagraph?.id === paragraph.id}
                      onClick={() => setSelectedParagraph(
                        selectedParagraph?.id === paragraph.id ? null : paragraph
                      )}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Paragraph detail panel */}
            <AnimatePresence>
              {selectedParagraph && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mt-4 bg-white rounded-xl border border-primary-200 overflow-hidden shadow-sm"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h4 className="text-sm font-semibold text-navy-900">Paragraph Analysis</h4>
                      <button
                        onClick={() => setSelectedParagraph(null)}
                        className="p-1 rounded hover:bg-neutral-100"
                        aria-label="Close"
                      >
                        <X className="w-4 h-4 text-neutral-400" />
                      </button>
                    </div>
                    
                    <div className="p-3 bg-neutral-50 rounded-lg mb-4">
                      <p className="text-xs text-neutral-600 italic leading-relaxed">"{selectedParagraph.text}"</p>
                    </div>

                    {selectedParagraph.aiScore !== null && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-neutral-500">AI Score:</span>
                        <span className={`text-xs font-semibold ${
                          selectedParagraph.aiScore <= 20 ? 'text-success-600' :
                          selectedParagraph.aiScore <= 50 ? 'text-warning-600' :
                          selectedParagraph.aiScore <= 75 ? 'text-orange-600' : 'text-danger-600'
                        }`}>
                          {selectedParagraph.aiScore}%
                        </span>
                      </div>
                    )}

                    {selectedParagraph.explanation && (
                      <p className="text-sm text-neutral-600 leading-relaxed mb-4">{selectedParagraph.explanation}</p>
                    )}

                    {selectedParagraph.rewriteSuggestion && (
                      <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                        <div className="flex items-center gap-2 mb-1">
                          <PenTool className="w-3.5 h-3.5 text-primary-600" />
                          <span className="text-xs font-medium text-primary-700">Suggested rewrite</span>
                        </div>
                        <p className="text-sm text-primary-800 leading-relaxed">{selectedParagraph.rewriteSuggestion}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                        Request rewrite
                      </button>
                      <button className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors">
                        Explain more
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right analytics panel - Desktop */}
        <div className="hidden lg:flex flex-col w-80 border-l border-neutral-200 bg-white overflow-y-auto">
          <AnalyticsPanel activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Right analytics panel - Mobile overlay */}
        <AnimatePresence>
          {showMobilePanel && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-40 bg-black/20"
                onClick={() => setShowMobilePanel(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="lg:hidden fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white border-l border-neutral-200 shadow-xl overflow-y-auto"
              >
                <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                  <h3 className="text-sm font-semibold text-navy-900">Analytics</h3>
                  <button
                    onClick={() => setShowMobilePanel(false)}
                    className="p-2 rounded-lg hover:bg-neutral-100"
                    aria-label="Close panel"
                  >
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
                <AnalyticsPanel activeTab={activeTab} setActiveTab={setActiveTab} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AnalyticsPanel({ activeTab, setActiveTab }: {
  activeTab: 'overview' | 'insights' | 'suggestions';
  setActiveTab: (tab: 'overview' | 'insights' | 'suggestions') => void;
}) {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'insights' as const, label: 'Insights', icon: Lightbulb },
    { id: 'suggestions' as const, label: 'Suggestions', icon: PenTool },
  ];

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'insights' && <InsightsTab />}
          {activeTab === 'suggestions' && <SuggestionsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-5">
      {/* Keywords */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-neutral-400" />
          <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider">Keywords</h4>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {mockAnalysis.keywords.map((kw) => (
            <span key={kw} className="px-2.5 py-1 text-[11px] font-medium bg-neutral-100 text-neutral-700 rounded-md hover:bg-primary-50 hover:text-primary-700 transition-colors cursor-default">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Resume sections */}
      {mockAnalysis.resumeSections && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-neutral-400" />
            <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider">Resume Sections</h4>
          </div>
          <div className="space-y-2">
            {mockAnalysis.resumeSections.map((section) => (
              <div key={section.name} className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  section.completeness === 'complete' ? 'bg-success-500' :
                  section.completeness === 'partial' ? 'bg-warning-500' : 'bg-danger-500'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-navy-900">{section.name}</p>
                  <p className="text-[10px] text-neutral-500 truncate">{section.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightsTab() {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-neutral-50 rounded-lg">
        <h4 className="text-xs font-semibold text-navy-900 mb-2">Sentence Patterns</h4>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Average sentence length: 18 words. Good variety in sentence structure detected.
        </p>
      </div>
      <div className="p-3 bg-neutral-50 rounded-lg">
        <h4 className="text-xs font-semibold text-navy-900 mb-2">Repeated Phrases</h4>
        <p className="text-xs text-neutral-600 leading-relaxed">
          "Experience" appears 4 times. Consider using synonyms for variety.
        </p>
      </div>
      <div className="p-3 bg-neutral-50 rounded-lg">
        <h4 className="text-xs font-semibold text-navy-900 mb-2">Action Verbs</h4>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Strong use of action verbs: Led, Implemented, Mentored. Consider adding more quantifiable outcomes.
        </p>
      </div>
      <div className="p-3 bg-warning-50 rounded-lg border border-warning-500/20">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 text-warning-600" />
          <h4 className="text-xs font-semibold text-warning-700">Attention</h4>
        </div>
        <p className="text-xs text-warning-700 leading-relaxed">
          One paragraph (index 3) shows strong AI-writing patterns. Review and personalize this content.
        </p>
      </div>
    </div>
  );
}

function SuggestionsTab() {
  return (
    <div className="space-y-3">
      {mockAnalysis.suggestions.map((suggestion, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-2.5 p-3 bg-neutral-50 rounded-lg hover:bg-primary-50 transition-colors group"
        >
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-primary-700">{i + 1}</span>
          </div>
          <p className="text-xs text-neutral-700 leading-relaxed group-hover:text-primary-800 transition-colors">
            {suggestion}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
