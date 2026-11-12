import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage               from './pages/LandingPage';
import OnboardingPage            from './pages/OnboardingPage';
import DashboardPage             from './pages/DashboardPage';
import OpportunitiesPage         from './pages/OpportunitiesPage';
import OpportunityDetailPage     from './pages/OpportunityDetailPage';
import RoadmapPage               from './pages/RoadmapPage';
import SkillExtractionPage       from './pages/SkillExtractionPage';

/**
 * App — root component. Declares all client-side routes.
 *
 * Route map:
 *   /                       → LandingPage
 *   /onboarding             → OnboardingPage         (Day 2)
 *   /skills/review          → SkillExtractionPage    (Day 3)
 *   /opportunities          → OpportunitiesPage      (Day 4)
 *   /opportunities/:id      → OpportunityDetailPage  (Day 4)
 *   /dashboard              → DashboardPage          (Day 7)
 *   /roadmap                → RoadmapPage            (Day 6)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<LandingPage />} />
        <Route path="/onboarding"          element={<OnboardingPage />} />
        <Route path="/skills/review"       element={<SkillExtractionPage />} />
        <Route path="/opportunities"       element={<OpportunitiesPage />} />
        <Route path="/opportunities/:id"   element={<OpportunityDetailPage />} />
        <Route path="/dashboard"           element={<DashboardPage />} />
        <Route path="/roadmap"             element={<RoadmapPage />} />
        <Route path="*"                    element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
