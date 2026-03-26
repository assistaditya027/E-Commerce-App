import { useState } from 'react';
import { assets } from '../assets/assets';

const Navbar = ({ setToken }) => {
  const [confirming, setConfirming] = useState(false);

  const handleLogout = () => {
    if (confirming) {
      setToken('');
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      {/* Logo */}
      <img
        className="h-7 sm:h-9 w-auto object-contain max-w-[100px] sm:max-w-[140px]"
        src={assets.logo}
        alt="Store logo"
      />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Admin badge — dot only on mobile, full badge on sm+ */}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="hidden sm:inline text-xs text-gray-500 font-medium tracking-wide">
            Admin Panel
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 sm:px-4 sm:py-2 sm:text-sm rounded-lg transition-all duration-200 active:scale-95 shadow-sm whitespace-nowrap ${
            confirming
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-900 hover:bg-black text-white'
          }`}
          title={confirming ? 'Click again to confirm logout' : 'Logout'}
        >
          {confirming ? (
            <>
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              <span className="hidden xs:inline sm:inline">Confirm?</span>
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navbar;
