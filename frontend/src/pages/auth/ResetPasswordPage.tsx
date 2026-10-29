import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { confirmPasswordReset } from '../../api/auth';
import {
  FileSpreadsheet,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { firstErrorMessage } from '../../utils/authErrors';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('Invalid or missing reset token. Please open the link from your email.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    if (!confirmPassword) {
      setErrorMessage('Confirm Password is required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await confirmPasswordReset({
        token: token.trim(),
        password,
      });

      setSuccess(true);
      toast.success(res.message || 'Password reset successfully.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } };
      const resData = axiosErr.response?.data;
      const msg =
        firstErrorMessage(resData?.detail) ||
        firstErrorMessage(resData?.password) ||
        firstErrorMessage(resData?.new_password) ||
        firstErrorMessage(resData) ||
        'Invalid or expired reset token.';
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
          <h2 className="text-base font-bold text-[#1e293b]">Reset Password</h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Create a new password for your account
          </p>
        </div>

        {success ? (
          <div className="p-6 space-y-4 text-xs text-center">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-[#1e293b]">Password reset successfully!</h3>
              <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
                You can now log in with your new password.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-2 px-4 bg-[#107c41] hover:bg-[#0d6936] text-white font-semibold rounded text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                {errorMessage}
              </div>
            )}

            {!token && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs">
                Warning: Reset link token is missing. Please click the full link from your email.
              </div>
            )}

            <div>
              <label className="block font-medium text-[#334155] mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="reset-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-10 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#94a3b8] hover:text-[#475569] p-0.5 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="reset-confirm-password-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  className="w-full pl-9 pr-10 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-[#94a3b8] hover:text-[#475569] p-0.5 rounded transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-2 px-4 bg-[#107c41] hover:bg-[#0d6936] text-white font-semibold rounded text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resetting password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 border-t border-[#e2e8f0] text-center">
              <Link
                to="/login"
                className="text-xs text-[#64748b] hover:text-[#107c41] transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
