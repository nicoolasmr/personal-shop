import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { WelcomeTour } from '@/components/onboarding/WelcomeTour';

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">
            <WelcomeTour />

            {/* Mobile Sidebar Overlay (Only active on small screens or when toggled) */}
            <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Desktop Sidebar (Always visible on large screens) */}
            <div className="hidden lg:flex flex-col h-full z-20">
                <Sidebar className="h-full border-r" />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden relative">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-2 md:p-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <div className="w-full h-full flex flex-col">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
