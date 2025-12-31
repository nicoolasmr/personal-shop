import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/hooks/useTenant";
import { AuthGuard } from "@/components/AuthGuard";
import { NavigationTracker } from "@/components/NavigationTracker";
import { GlobalLoadingIndicator } from "@/components/GlobalLoadingIndicator";
import LoadingScreen from "@/components/LoadingScreen";
import { RuntimeErrorBoundary } from "@/components/RuntimeErrorBoundary";

// Public pages - Lazy loaded
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const Home = lazy(() => import("./pages/Home"));

// App layout and pages - Lazy loaded
const AppLayout = lazy(() => import("./layouts/AppLayout"));
const Tasks = lazy(() => import("./pages/tasks/TasksPage"));
const Goals = lazy(() => import("./pages/goals/GoalsPage"));
const Statistics = lazy(() => import("./pages/statistics/StatisticsPage"));
const Finance = lazy(() => import("./pages/finance/FinancePage"));
const CalendarPage = lazy(() => import("./pages/calendar/CalendarPage"));
const Profile = lazy(() => import("./pages/profile/ProfilePage"));
const Settings = lazy(() => import("./pages/settings/SettingsPage"));

// Ops Console Imports - Lazy loaded
const OpsGuard = lazy(() => import("./guards/OpsGuard"));
const OpsLayout = lazy(() => import("./pages/ops/OpsLayout"));
const OpsHome = lazy(() => import("./pages/ops/OpsHome"));
const OpsUsers = lazy(() => import("./pages/ops/OpsUsers"));
const OpsTeam = lazy(() => import("./pages/ops/OpsTeam"));
const Diagnostics = lazy(() => import("./pages/ops/Diagnostics"));
const Bugs = lazy(() => import("./pages/ops/Bugs"));
const Billing = lazy(() => import("./pages/ops/Billing"));
const FeatureFlags = lazy(() => import("./pages/ops/FeatureFlags"));


const App = () => (
    <TooltipProvider>
        <AuthProvider>
            <TenantProvider>
                <Toaster />
                <Sonner position="top-right" closeButton richColors />
                <BrowserRouter>
                    <NavigationTracker />
                    <GlobalLoadingIndicator />
                    <RuntimeErrorBoundary>
                        <Suspense fallback={<LoadingScreen />}>
                            <Routes>
                                {/* Public routes */}
                                <Route path="/" element={<Navigate to="/login" replace />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                                <Route path="/cadastro" element={<Navigate to="/signup" replace />} />

                                {/* Protected app routes */}
                                <Route
                                    path="/app"
                                    element={
                                        <AuthGuard>
                                            <AppLayout />
                                        </AuthGuard>
                                    }
                                >
                                    <Route index element={<Navigate to="/app/home" replace />} />
                                    <Route path="home" element={<Home />} />
                                    <Route path="tasks" element={<Tasks />} />
                                    <Route path="habits" element={<Navigate to="/app/goals?tab=habits" replace />} />
                                    <Route path="goals" element={<Goals />} />
                                    <Route path="stats" element={<Statistics />} />
                                    <Route path="finance" element={<Finance />} />
                                    <Route path="calendar" element={<CalendarPage />} />
                                    <Route path="profile" element={<Profile />} />
                                    <Route path="settings" element={<Settings />} />
                                </Route>

                                {/* Ops Console Routes */}
                                <Route path="/ops" element={<OpsGuard />}>
                                    <Route element={<OpsLayout />}>
                                        <Route index element={<OpsHome />} />
                                        <Route path="users" element={<OpsUsers />} />
                                        <Route path="team" element={<OpsTeam />} />
                                        <Route path="diagnostics" element={<Diagnostics />} />
                                        <Route path="bugs" element={<Bugs />} />
                                        <Route path="billing" element={<Billing />} />
                                        <Route path="flags" element={<FeatureFlags />} />
                                    </Route>
                                </Route>

                                {/* Catch-all */}
                                <Route path="*" element={<Home />} />
                            </Routes>
                        </Suspense>
                    </RuntimeErrorBoundary>
                </BrowserRouter>
            </TenantProvider>
        </AuthProvider>
    </TooltipProvider>
);

export default App;
