
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/layouts/AppLayout";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Home from "@/pages/Home";
import GoalsPage from "@/pages/goals/GoalsPage";
import FinancePage from "@/pages/finance/FinancePage";
import StatisticsPage from "@/pages/statistics/StatisticsPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import SettingsPage from "@/pages/settings/SettingsPage";
import CalendarPage from "@/pages/calendar/CalendarPage";
import TasksPage from "@/pages/tasks/TasksPage";
import { useAuth } from "@/contexts/AuthContext";

import { AuthGuard } from "@/components/AuthGuard";
import { TenantProvider } from "@/contexts/TenantContext";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <TenantProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

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
                            <Route path="tasks" element={<TasksPage />} />
                            <Route path="goals" element={<GoalsPage />} />
                            <Route path="stats" element={<StatisticsPage />} />
                            <Route path="finance" element={<FinancePage />} />
                            <Route path="calendar" element={<CalendarPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="settings" element={<SettingsPage />} />
                        </Route>

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to="/app/home" replace />} />
                    </Routes>
                </BrowserRouter>
            </TenantProvider>
        </AuthProvider>
    </QueryClientProvider>
);

export default App;
