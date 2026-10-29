import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { requestPasswordReset } from '../../api/auth';
import {
  FileSpreadsheet,
  Mail,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { firstErrorMessage } from '../../utils/authErrors';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await requestPasswordReset(cleanEmail);
      setSuccessMessage(
        data.message || 'If an account with this email exists, a password reset link has been sent.'
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } };
      const resData = axiosErr.response?.data;
      const msg =
        firstErrorMessage(resData?.email) ||
        firstErrorMessage(resData?.detail) ||
        firstErrorMessage(resData) ||
        'Failed to send request. Please check your internet connection.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col justify-center items-center p-4 font-['Inter',sans-serif]">
      {/* Excel CRM Brand Ribbon */}
      <div className="w-full max-w-md mb-4 text-center">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-[#107c41] text-white rounded-md shadow-sm">
          <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
          <span className="font-bold text-sm tracking-tight">Shop Inventory</span>
          <span className="text-[10px] bg-[#0d6936] px-1.5 py-0.5 rounded text-emerald-100 uppercase tracking-wider font-semibold">
            Excel CRM
          </span>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-md border border-[#cbd5e1] shadow-md overflow-hidden">
        <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
          <h2 className="text-base font-bold text-[#1e293b]">Forgot Password</h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Enter your email to receive a password reset link
          </p>
        </div>

        {successMessage ? (
          <div className="p-6 space-y-4 text-xs text-center">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#1e293b]">Check your inbox</h3>
              <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
                {successMessage}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full py-2 px-4 bg-[#107c41] hover:bg-[#0d6936] text-white font-semibold rounded text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <span>Back to Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="w-full py-2 px-4 border border-[#cbd5e1] hover:bg-slate-50 text-[#475569] font-medium rounded text-xs transition-colors"
              >
                Send to another email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="email"
                  id="forgot-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="email"
                  autoFocus
                  placeholder="user@example.com"
                  className="w-full pl-10 pr-3 h-11 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
                />
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                A password reset link will be sent to this email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#107c41] hover:bg-[#0d6936] text-white font-semibold rounded text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send reset link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 border-t border-[#e2e8f0] text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#64748b] hover:text-[#107c41] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
