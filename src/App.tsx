
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Deliveries from "./pages/Deliveries";
import Reports from "./pages/Reports";
import Invoices from "./pages/Invoices";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/Layout/AppLayout";
import Auth from "./pages/Auth";
import React from "react";
import Index from "./pages/Index";

const queryClient = new QueryClient();

// Protected route component with role-based access
// This is INSIDE the AuthProvider context
const ProtectedRouteContent = ({ 
  children, 
  allowedRoles = [] 
}: { 
  children: React.ReactNode, 
  allowedRoles?: string[] 
}) => {
  const { user, isLoading, hasAccess } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user's role allows access
  if (allowedRoles.length > 0 && !hasAccess(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Separate component to wrap the entire app with providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            
            <Route path="/" element={
              <ProtectedRouteContent>
                <AppLayout />
              </ProtectedRouteContent>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="productos" element={
                <ProtectedRouteContent allowedRoles={['admin', 'oficinista']}>
                  <Products />
                </ProtectedRouteContent>
              } />
              <Route path="inventario" element={
                <ProtectedRouteContent allowedRoles={['admin', 'oficinista']}>
                  <Inventory />
                </ProtectedRouteContent>
              } />
              <Route path="pedidos" element={
                <ProtectedRouteContent allowedRoles={['admin', 'oficinista', 'bodeguero', 'cliente']}>
                  <Orders />
                </ProtectedRouteContent>
              } />
              <Route path="entregas" element={
                <ProtectedRouteContent allowedRoles={['admin', 'oficinista', 'bodeguero', 'domiciliario']}>
                  <Deliveries />
                </ProtectedRouteContent>
              } />
              <Route path="reportes" element={
                <ProtectedRouteContent allowedRoles={['admin', 'oficinista']}>
                  <Reports />
                </ProtectedRouteContent>
              } />
              <Route path="facturas" element={
                <ProtectedRouteContent allowedRoles={['admin', 'oficinista', 'cliente']}>
                  <Invoices />
                </ProtectedRouteContent>
              } />
              <Route path="usuarios" element={
                <ProtectedRouteContent allowedRoles={['admin']}>
                  <Users />
                </ProtectedRouteContent>
              } />
              <Route path="configuracion" element={
                <ProtectedRouteContent allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRouteContent>
              } />
            </Route>
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
