import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

// Not found/Errors
const NotFound = lazy(() => import("./pages/Home")); // Fallback to Home or specific NotFound if exists

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error: unknown) => {
                // Don't retry on 404 or Unauthorized
                const err = error as { status?: number };
                if (err?.status === 404 || err?.status === 401) return false;
                return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            staleTime: 1000 * 60 * 5, // 5 minutes (more offline-friendly)
            gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24h
            refetchOnWindowFocus: true,
            refetchOnReconnect: 'always',
        },
        mutations: {
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        }
    },
});

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <AuthProvider>
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
            </AuthProvider>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
