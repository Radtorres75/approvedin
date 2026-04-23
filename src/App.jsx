import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-4 border-sand-dark border-t-teal rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public */}
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

      {/* Signup flows */}
      <Route path="/onboarding" element={<AssociationOnboarding />} />
      <Route path="/portal/vendor/setup" element={<VendorSetup />} />
      <Route path="/resident/signup" element={<ResidentSignup />} />

      {/* Association portal */}
      <Route path="/portal/association" element={<AssociationDashboard />} />
      <Route path="/portal/association/vendors" element={<AssociationVendorDirectory />} />
      <Route path="/portal/association/documents" element={<AssociationDocumentVault />} />
      <Route path="/portal/association/settings" element={<AssociationSettingsPage />} />

      {/* Vendor portal */}
      <Route path="/portal/vendor" element={<VendorDashboard />} />
      <Route path="/portal/vendor/documents" element={<VendorDocumentsPage />} />
      <Route path="/portal/vendor/associations" element={<VendorAssociationsPage />} />
      <Route path="/portal/vendor/profile" element={<VendorProfilePage />} />
      <Route path="/portal/vendor/settings" element={<VendorSettingsPage />} />

      {/* Resident portal */}
      <Route path="/portal/resident/dashboard" element={<ResidentHome />} />
      <Route path="/portal/resident/vendors" element={<ResidentVendorDirectory />} />
      <Route path="/portal/resident/profile" element={<ResidentProfilePage />} />
      <Route path="/portal/resident/notifications" element={<ResidentNotificationsPage />} />

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