import { Link, useLocation } from 'react-router-dom';

/**
 * SiteHeader — top navigation bar.
 * Shows the product logo/name and nav links.
 * Active link is highlighted in brand green.
 */
export function SiteHeader() {
  const { pathname } = useLocation();

  const navLinks = [
    { label: 'Opportunities', href: '/opportunities' },
    { label: 'Roadmap',       href: '/roadmap'       },
    { label: 'Dashboard',     href: '/dashboard'     },
  ];

  // Only show nav links once the user has started (not on landing)
  const showNav = pathname !== '/';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo / wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2 no-underline hover:no-underline group"
          aria-label="SkillBridge AI home"
        >
          <span className="w-7 h-7 rounded-md bg-brand-green flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 13L8 3L13 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 9.5H11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="text-[15px] font-semibold text-text-primary">
            SkillBridge <span className="text-brand-green">AI</span>
          </span>
        </Link>

        {/* Navigation */}
        {showNav && (
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-1 list-none m-0 p-0">
              {navLinks.map(({ label, href }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      to={href}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium no-underline transition-colors
                        ${isActive
                          ? 'bg-brand-green-lt text-green-800'
                          : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                        }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Profile link (shown after onboarding) */}
        {showNav && (
          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-brand-green-lt flex items-center justify-center text-green-800 text-sm font-semibold no-underline hover:bg-green-200 transition-colors"
            aria-label="View profile"
            title="Your profile"
          >
            D
          </Link>
        )}
      </div>
    </header>
  );
}
