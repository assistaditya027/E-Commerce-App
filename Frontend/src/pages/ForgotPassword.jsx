import { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const { backendUrl, navigate } = useContext(ShopContext);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [focused, setFocused] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return toast.error('Email is required.');
    if (!emailRegex.test(value)) return toast.error('Enter a valid email.');
    if (!backendUrl) return toast.error('Backend URL is not configured.');

    try {
      setSending(true);
      setDevLink('');
      const apiBase = backendUrl.replace(/\/+$/, '');
      const { data } = await axios.post(`${apiBase}/api/user/forgot-password`, { email: value });
      toast.success(data.message || 'Check your email for a reset link.');
      setSent(true);
      if (data.resetUrl) setDevLink(data.resetUrl);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to send reset email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-12 pb-16 px-1 sm:px-0">
      <div className="text-2xl mb-10">
        <Title text1={'FORGOT'} text2={'PASSWORD'} />
      </div>

      <div className="max-w-md space-y-4">
        {/* ── Main card ── */}
        <div
          className="bg-white dark:bg-gray-900
          border border-gray-100 dark:border-gray-800
          rounded-2xl p-6 sm:p-7 shadow-sm"
        >
          {/* ── Sent state ── */}
          {sent ? (
            <div className="flex flex-col items-center text-center py-4 gap-4">
              {/* Check icon */}
              <div
                className="w-14 h-14 rounded-2xl
                bg-emerald-50 dark:bg-emerald-900/20
                flex items-center justify-center"
              >
                <svg
                  className="w-7 h-7 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7
                    a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Check your inbox
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 leading-relaxed">
                  We've sent a reset link to{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
                  <br />
                  It may take a minute to arrive.
                </p>
              </div>

              {/* Resend option */}
              <button
                onClick={() => {
                  setSent(false);
                  setDevLink('');
                }}
                className="text-xs text-gray-400 dark:text-gray-500
                  hover:text-gray-900 dark:hover:text-white
                  underline underline-offset-2 transition-colors"
              >
                Didn't receive it? Try again
              </button>

              {/* Dev link */}
              {devLink && (
                <div
                  className="w-full mt-1 px-4 py-3 rounded-xl
                  bg-amber-50 dark:bg-amber-900/10
                  border border-amber-200 dark:border-amber-800/40"
                >
                  <p
                    className="text-[10px] tracking-widest uppercase font-semibold
                    text-amber-600 dark:text-amber-400 mb-1.5"
                  >
                    Dev — Reset Link
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 break-all leading-relaxed mb-2">
                    {devLink}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(devLink);
                      toast.success('Link copied');
                    }}
                    className="text-xs font-medium text-amber-700 dark:text-amber-300
                      underline underline-offset-2 hover:opacity-70 transition-opacity"
                  >
                    Copy link
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Default form state ── */
            <>
              {/* Icon + heading */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl
                  bg-gray-100 dark:bg-gray-800
                  flex items-center justify-center flex-shrink-0"
                >
                  <svg
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4
                      a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                    Reset your password
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    We'll send a link to your email address.
                  </p>
                </div>
              </div>

              <form onSubmit={submit} className="flex flex-col gap-3">
                {/* Email input with icon */}
                <div
                  className={`relative rounded-xl transition-all duration-150
                  ${
                    focused
                      ? 'ring-2 ring-gray-900 dark:ring-white'
                      : 'ring-1 ring-gray-200 dark:ring-gray-700'
                  }`}
                >
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7
                        a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl
                      bg-gray-50 dark:bg-gray-950
                      text-sm text-gray-900 dark:text-gray-100
                      placeholder:text-gray-400 dark:placeholder:text-gray-600
                      outline-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2
                    bg-gray-900 text-white dark:bg-white dark:text-gray-900
                    text-xs tracking-[0.18em] uppercase font-medium
                    py-3.5 rounded-xl
                    hover:opacity-90 active:scale-[0.99]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-150"
                >
                  {sending ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to login */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-xs
            text-gray-400 dark:text-gray-500
            hover:text-gray-900 dark:hover:text-white
            transition-colors duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
