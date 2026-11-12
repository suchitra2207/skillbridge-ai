import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

/**
 * PageShell — wraps every page with header, footer, and a max-width content area.
 *
 * @param {boolean} noFooter - omit the footer (used on landing page which has its own)
 */
export function PageShell({ children, noFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      {!noFooter && <SiteFooter />}
    </div>
  );
}
