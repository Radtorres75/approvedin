import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect } from 'react';

// Public pages
import Home from './pages/Home';
import AssociationsLanding from './pages/AssociationsLanding';
import VendorsLanding from './pages/VendorsLanding';
import ResidentsLanding from './pages/ResidentsLanding';
import SignIn from './pages/SignIn';
import Pricing from './pages/Pricing';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// Onboarding & signup
import AssociationOnboarding from './pages/AssociationOnboarding';
import VendorSetup from './pages/VendorSetup';
import ResidentSignup from './pages/ResidentSignup';

// Association portal
import AssociationDashboard from './pages/association/AssociationDashboard';
import AssociationVendorDirectory from './pages/association/AssociationVendorDirectory';
import AssociationDocumentVault from './pages/association/AssociationDocumentVault';
import AssociationSettingsPage from './pages/association/AssociationSettingsPage';

// Vendor portal
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorDocumentsPage from './pages/vendor/VendorDocumentsPage';
import VendorAssociationsPage from './pages/vendor/VendorAssociationsPage';
import VendorProfilePage from './pages/vendor/VendorProfilePage';
import VendorSettingsPage from './pages/vendor/VendorSettingsPage';

// Resident portal
import ResidentHome from './pages/resident/ResidentHome';
import ResidentVendorDirectory from './pages/resident/ResidentVendorDirectory';
import ResidentProfilePage from './pages/resident/ResidentProfilePage';
import ResidentNotificationsPage from './pages/resident/ResidentNotificationsPage';

// ProtectedRoute: waits for auth check to complete before deciding to redirect
const ProtectedRoute = ({ children }) => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authChecked } = useAuth();

  // Still waiting for session — show spinner, do NOT redirect yet
  if (isLoadingAuth || isLoadingPublicSettings || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin"></div>
      </div>
    );
  }

  // Auth check complete and user is not authenticated — soft redirect
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, authChecked, navigateRef } = useAuth();
  const navigate = useNavigate();

  // Register the React Router navigate fn into AuthContext
  // so navigateToLogin() uses soft navigation instead of window.location.href
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate, navigateRef]);

  // Show spinner while session is being established — never redirect during this window
  if (isLoadingPublicSettings || isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin"></div>
      </div>
    );
  }

  // Only handle non-auth errors here — auth_required is handled per-route by ProtectedRoute
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/" element={<Home />} />
      <Route path="/associations" element={<AssociationsLanding />} />
      <Route path="/vendors" element={<VendorsLanding />} />
      <Route path="/residents" element={<ResidentsLanding />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/about" element={<About />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      {/* Signup flows — auth not required (user is mid-registration) */}
      <Route path="/onboarding" element={<AssociationOnboarding />} />
      <Route path="/portal/vendor/setup" element={<VendorSetup />} />
      <Route path="/resident/signup" element={<ResidentSignup />} />

      {/* Association portal — protected */}
      <Route path="/portal/association" element={<ProtectedRoute><AssociationDashboard /></ProtectedRoute>} />
      <Route path="/portal/association/vendors" element={<ProtectedRoute><AssociationVendorDirectory /></ProtectedRoute>} />
      <Route path="/portal/association/documents" element={<ProtectedRoute><AssociationDocumentVault /></ProtectedRoute>} />
      <Route path="/portal/association/settings" element={<ProtectedRoute><AssociationSettingsPage /></ProtectedRoute>} />

      {/* Vendor portal — protected */}
      <Route path="/portal/vendor" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
      <Route path="/portal/vendor/documents" element={<ProtectedRoute><VendorDocumentsPage /></ProtectedRoute>} />
      <Route path="/portal/vendor/associations" element={<ProtectedRoute><VendorAssociationsPage /></ProtectedRoute>} />
      <Route path="/portal/vendor/profile" element={<ProtectedRoute><VendorProfilePage /></ProtectedRoute>} />
      <Route path="/portal/vendor/settings" element={<ProtectedRoute><VendorSettingsPage /></ProtectedRoute>} />

      {/* Resident portal — protected */}
      <Route path="/portal/resident/dashboard" element={<ProtectedRoute><ResidentHome /></ProtectedRoute>} />
      <Route path="/portal/resident/vendors" element={<ProtectedRoute><ResidentVendorDirectory /></ProtectedRoute>} />
      <Route path="/portal/resident/profile" element={<ProtectedRoute><ResidentProfilePage /></ProtectedRoute>} />
      <Route path="/portal/resident/notifications" element={<ProtectedRoute><ResidentNotificationsPage /></ProtectedRoute>} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
