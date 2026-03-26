import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';

const navItems = [
  { to: '/add', icon: assets.add_icon, label: 'Add Items' },
  { to: '/list', icon: assets.list_icon, label: 'List Items' },
  { to: '/edit', icon: assets.add_icon, label: 'Edit Items' },
  { to: '/orders', icon: assets.order_icon, label: 'Orders' },
];

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavItems = ({ mobile = false }) => (
    <div className={`flex flex-col gap-0.5 flex-1 ${mobile ? 'pt-4 px-3 pb-3' : 'pt-6 px-2'}`}>
      {(!collapsed || mobile) && (
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-3 whitespace-nowrap">
          Navigation
        </p>
      )}

      {navItems.map(({ to, icon, label }) => {
        const isActive = location.pathname === to;
        const isIconOnly = collapsed && !mobile;

        return (
          <NavLink
            key={to}
            to={to}
            title={isIconOnly ? label : ''}
            onClick={() => mobile && setMobileOpen(false)}
            className={`
              relative flex items-center py-2.5 rounded-lg
              transition-all duration-150 ease-in-out group overflow-hidden
              ${isIconOnly ? 'justify-center px-2' : 'gap-3 px-3'}
              ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm shadow-gray-900/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            {isActive && isIconOnly && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/60 rounded-r-full" />
            )}

            <img
              className={`w-[18px] h-[18px] flex-shrink-0 transition-all duration-200
                ${isActive ? 'brightness-0 invert' : 'opacity-50 group-hover:opacity-90'}`}
              src={icon}
              alt=""
              aria-hidden="true"
            />

            {!isIconOnly && (
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{label}</span>
            )}

            {isIconOnly && (
              <span
                className="
                absolute left-full ml-3 px-2.5 py-1.5 text-xs font-medium
                bg-gray-900 text-white rounded-md whitespace-nowrap shadow-lg
                opacity-0 pointer-events-none -translate-x-1
                group-hover:opacity-100 group-hover:translate-x-0
                transition-all duration-150 z-50
              "
              >
                {label}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ── MOBILE: sidebar replaced by top dropdown ── */}
      <div className="sm:hidden w-full bg-white border-b border-gray-200 shadow-sm">
        {/* Hamburger bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Menu
          </span>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Collapsible nav */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? 'max-h-72' : 'max-h-0'}`}
        >
          <NavItems mobile />
          <div className="px-5 py-2.5 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">Admin v1.0</p>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: collapsible sidebar ── */}
      <div
        style={{ width: collapsed ? '64px' : '208px' }}
        className="hidden sm:flex relative min-h-screen bg-white border-r border-gray-200 shadow-[1px_0_0_rgba(15,23,42,0.04)] flex-col flex-shrink-0 transition-[width] duration-300 ease-in-out overflow-visible"
      >
        {/* Toggle button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-7 z-50 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 hover:shadow-md transition-all duration-200"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <NavItems />

        <div
          className="border-t border-gray-100 transition-all duration-300 ease-in-out"
          style={{ padding: collapsed ? '12px 8px' : '12px 20px' }}
        >
          {collapsed ? (
            <div className="flex justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 whitespace-nowrap">Admin v1.0</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
