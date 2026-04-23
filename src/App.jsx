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
import FixMyRole from './pages/FixMyRole';
import VendorSetup from './pages/VendorSetup';
import ResidentSignup from './pages/ResidentSignup';

// Association portal
import AssociationPortal from './pages/association/AssociationPortal';
import AssociationVendors from './pages/association/AssociationVendors';
import AssociationDocuments from './pages/association/AssociationDocuments';
import AssociationSettings from './pages/association/AssociationSettings';

// Vendor portal
import VendorPortal from './pages/vendor/VendorPortal';
import VendorDocuments from './pages/vendor/VendorDocuments';
import VendorAssociations from './pages/vendor/VendorAssociations';
import VendorProfile from './pages/vendor/VendorProfile';
import VendorSettings from './pages/vendor/VendorSettings';

// Resident portal
import ResidentDashboard from './pages/resident/ResidentDashboard';
import ResidentVendors from './pages/resident/ResidentVendors';
import ResidentProfile from './pages/resident/ResidentProfile';
import ResidentNotifications from './pages/resident/ResidentNotifications';

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
      <Route path="/fix-role" element={<FixMyRole />} />

      {/* Association portal */}
      <Route path="/portal/association" element={<AssociationPortal />} />
      <Route path="/portal/association/vendors" element={<AssociationVendors />} />
      <Route path="/portal/association/documents" element={<AssociationDocuments />} />
      <Route path="/portal/association/settings" element={<AssociationSettings />} />

      {/* Vendor portal */}
      <Route path="/portal/vendor" element={<VendorPortal />} />
      <Route path="/portal/vendor/documents" element={<VendorDocuments />} />
      <Route path="/portal/vendor/associations" element={<VendorAssociations />} />
      <Route path="/portal/vendor/profile" element={<VendorProfile />} />
      <Route path="/portal/vendor/settings" element={<VendorSettings />} />

      {/* Resident portal */}
      <Route path="/portal/resident/dashboard" element={<ResidentDashboard />} />
      <Route path="/portal/resident/vendors" element={<ResidentVendors />} />
      <Route path="/portal/resident/profile" element={<ResidentProfile />} />
      <Route path="/portal/resident/notifications" element={<ResidentNotifications />} />

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