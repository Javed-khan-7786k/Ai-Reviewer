import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  FileText,
  Shield,
  Sparkles,
  BarChart3,
  Search,
  PenTool,
  Upload,
  Cpu,
  Eye,
  ArrowRight,
  Check,
  Lock,
  Trash2,
  Server,
  Menu,
  X,
} from 'lucide-react';

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-navy-900">AI Reviewer</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-neutral-600 hover:text-navy-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-navy-900 transition-colors">How it works</a>
            <a href="#privacy" className="text-sm text-neutral-600 hover:text-navy-900 transition-colors">Privacy</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-navy-900 transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-white bg-navy-900 hover:bg-navy-800 px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4 border-t border-neutral-100 mt-2 pt-4"
          >
            <nav className="flex flex-col gap-3">
              <a href="#features" className="text-sm text-neutral-600 px-2 py-1">Features</a>
              <a href="#how-it-works" className="text-sm text-neutral-600 px-2 py-1">How it works</a>
              <a href="#privacy" className="text-sm text-neutral-600 px-2 py-1">Privacy</a>
              <Link to="/login" className="text-sm text-neutral-600 px-2 py-1">Sign in</Link>
              <Link to="/login" className="text-sm font-medium text-white bg-navy-900 px-4 py-2 rounded-lg text-center">
                Get started
              </Link>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Document Analysis
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-navy-900 leading-[1.1] tracking-tight">
                Understand Your Documents.{' '}
                <span className="text-primary-600">Improve Your Writing.</span>
              </h1>
              <p className="mt-6 text-lg text-neutral-600 leading-relaxed max-w-xl">
                Upload a resume or short document to receive structured feedback, readability insights, 
                keyword analysis, and optional AI-writing likelihood estimates.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Upload a document
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-navy-900 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors"
                >
                  Explore how it works
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right - Interactive Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-xl shadow-neutral-200/50 p-6 overflow-hidden">
              {/* Document preview */}
              <div className="flex items-start gap-4">
                {/* Document text area */}
                <div className="flex-1 space-y-3">
                  <div className="h-3 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                  <div className="h-3 bg-neutral-100 rounded w-5/6" />
                  <div className="h-3 bg-primary-100 rounded w-full border-l-2 border-primary-400 pl-2" />
                  <div className="h-3 bg-primary-50 rounded w-4/5 border-l-2 border-primary-300 pl-2" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                  <div className="h-3 bg-neutral-100 rounded w-3/4" />
                  <div className="h-3 bg-amber-50 rounded w-2/3 border-l-2 border-amber-300 pl-2" />
                  <div className="h-3 bg-neutral-100 rounded w-5/6" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                </div>

                {/* Circular metric */}
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e7e5e4"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray="72, 100"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-navy-900">
                        <AnimatedCounter target={72} />
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-neutral-500 mt-1">Readability</p>
                </div>
              </div>

              {/* Keywords chips */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {['React', 'TypeScript', 'Leadership', 'CI/CD', 'System Design'].map((kw) => (
                  <span key={kw} className="px-2 py-0.5 text-[10px] font-medium bg-neutral-100 text-neutral-600 rounded-md">
                    {kw}
                  </span>
                ))}
              </div>

              {/* Insight card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="mt-4 p-3 bg-success-50 border border-success-500/20 rounded-lg"
              >
                <p className="text-xs text-success-600 font-medium">✓ Strong quantifiable achievements detected</p>
              </motion.div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.3 }}
              className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-neutral-200 shadow-lg p-3 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-navy-900">AI Analysis</p>
                <p className="text-[10px] text-neutral-500">15% likelihood</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: FileText, title: 'Resume Feedback', description: 'Get structured analysis of your resume with actionable improvement suggestions.' },
  { icon: Eye, title: 'Document Insights', description: 'Understand document structure, quality, and key patterns in your writing.' },
  { icon: BarChart3, title: 'Readability Analysis', description: 'Measure how easily your text can be read and understood by your audience.' },
  { icon: Search, title: 'Keyword Extraction', description: 'Identify important terms and ensure your document covers relevant topics.' },
  { icon: Cpu, title: 'AI-Writing Estimate', description: 'Get an optional likelihood estimate of AI-generated content patterns.' },
  { icon: PenTool, title: 'AI-Assisted Rewriting', description: 'Receive suggestions to improve clarity, conciseness, and professionalism.' },
];

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 tracking-tight">
            Everything you need to improve your documents
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Comprehensive analysis tools designed for professionals who care about their writing.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group p-6 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                <feature.icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-navy-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { icon: Upload, title: 'Upload your document', description: 'Drag and drop or select a PDF or DOCX file.' },
  { icon: Cpu, title: 'AI analyzes the content', description: 'Our system extracts text and runs comprehensive analysis.' },
  { icon: Eye, title: 'Explore insights', description: 'View highlighted text, keywords, readability, and AI estimates.' },
  { icon: PenTool, title: 'Improve your writing', description: 'Get AI-assisted suggestions to strengthen your document.' },
];

function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            From upload to actionable insights in seconds.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-neutral-200" />
              )}
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-neutral-200 shadow-sm mb-4">
                <step.icon className="w-6 h-6 text-primary-600" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-navy-900 text-white text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-navy-900 mb-1">{step.title}</h3>
              <p className="text-sm text-neutral-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const privacyItems = [
    { icon: Lock, title: 'Private storage', description: 'Your documents are stored privately and encrypted at rest.' },
    { icon: Server, title: 'Secure processing', description: 'Analysis runs in isolated environments with strict access controls.' },
    { icon: Trash2, title: 'User-controlled deletion', description: 'Delete your documents and all associated data at any time.' },
    { icon: Shield, title: 'No data sharing', description: 'We never share your documents with third parties.' },
  ];

  return (
    <section id="privacy" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 tracking-tight">
            Your documents stay private
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Security and privacy are built into every part of the product.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {privacyItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-5 rounded-xl bg-neutral-50 border border-neutral-100"
            >
              <item.icon className="w-5 h-5 text-navy-700 mb-3" />
              <h3 className="text-sm font-semibold text-navy-900 mb-1">{item.title}</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 tracking-tight">
            Ready to improve your documents?
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Upload your first document and get structured feedback in seconds.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 text-sm font-medium text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Get started free
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-navy-900 text-sm">AI Reviewer</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Understand your documents and improve your writing with AI-powered analysis.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-xs text-neutral-600 hover:text-navy-900 transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-xs text-neutral-600 hover:text-navy-900 transition-colors">How it works</a></li>
              <li><Link to="/login" className="text-xs text-neutral-600 hover:text-navy-900 transition-colors">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-neutral-600 hover:text-navy-900 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-xs text-neutral-600 hover:text-navy-900 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-navy-900 uppercase tracking-wider mb-3">Contact</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-neutral-600 hover:text-navy-900 transition-colors">Support</a></li>
              <li><a href="#" className="text-xs text-neutral-600 hover:text-navy-900 transition-colors">Feedback</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">© 2024 AI Reviewer. All rights reserved.</p>
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <Check className="w-3 h-3 text-success-500" />
            <span>Built with privacy in mind</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PrivacySection />
      <CTASection />
      <Footer />
    </div>
  );
}
