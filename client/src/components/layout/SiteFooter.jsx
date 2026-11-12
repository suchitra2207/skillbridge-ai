/**
 * SiteFooter — minimal site footer.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
        <p className="m-0">
          © 2026 SkillBridge AI — Built for IBM Bobathon: Build for Bengaluru
        </p>
        <p className="m-0 text-center">
          ⚠️ All opportunities shown are{' '}
          <strong className="font-medium text-text-secondary">DEMO DATA</strong>
          {' '}— fictional listings for demonstration purposes only.
          Not a real placement or recruitment service.
        </p>
      </div>
    </footer>
  );
}
