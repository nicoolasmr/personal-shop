
const OpsHome = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
            <h1 className="text-3xl font-bold text-slate-200">Ops Console</h1>
            <p className="text-slate-400 max-w-md">
                This console is currently disabled or in maintenance mode.
                Core modules are waiting for activation via feature flags.
            </p>
            <div className="mt-8 p-4 bg-slate-800 rounded border border-slate-700 font-mono text-sm text-left">
                <p className="text-emerald-500">$ status check</p>
                <p className="text-slate-300">admin_console_enabled = <span className="text-red-400">false (default)</span></p>
                <p className="text-slate-300">system_integrity = <span className="text-emerald-400">ok</span></p>
            </div>
        </div>
    );
};

export default OpsHome;
