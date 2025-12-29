// =============================================================================
// Navigation Breadcrumbs for Debugging
// =============================================================================

interface NavigationBreadcrumb {
    timestamp: string;
    type: "navigation" | "error" | "action" | "render";
    path?: string;
    from?: string;
    message: string;
    metadata?: Record<string, string | number | boolean>;
}

const MAX_BREADCRUMBS = 50;
const breadcrumbs: NavigationBreadcrumb[] = [];

export function addBreadcrumb(
    type: NavigationBreadcrumb["type"],
    message: string,
    metadata?: NavigationBreadcrumb["metadata"]
): void {
    const entry: NavigationBreadcrumb = { timestamp: new Date().toISOString(), type, message, metadata };
    if (type === "navigation" && metadata?.path) {
        entry.path = String(metadata.path);
        entry.from = metadata.from ? String(metadata.from) : undefined;
    }
    breadcrumbs.push(entry);
    if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();
    if (import.meta.env.DEV) console.log(`[Breadcrumb] ${type}: ${message}`, metadata || "");
}

export function getBreadcrumbs(): NavigationBreadcrumb[] { return [...breadcrumbs]; }

export function getBreadcrumbsAsText(): string {
    return breadcrumbs.map((b) => `[${b.timestamp}] ${b.type.toUpperCase()}: ${b.message}`).join("\n");
}

export function clearBreadcrumbs(): void { breadcrumbs.length = 0; }

export function recordNavigation(to: string, from?: string): void {
    addBreadcrumb("navigation", `Navigate: ${from || "(start)"} → ${to}`, { path: to, from: from || "" });
}

export function recordRender(componentName: string): void { addBreadcrumb("render", `Rendered: ${componentName}`); }

export function recordAction(action: string, target?: string): void {
    addBreadcrumb("action", `Action: ${action}${target ? ` on ${target}` : ""}`);
}

export function recordError(message: string, source?: string): void {
    addBreadcrumb("error", `Error: ${message}`, source ? { source } : undefined);
}

export default {
    add: addBreadcrumb, getAll: getBreadcrumbs, getText: getBreadcrumbsAsText, clear: clearBreadcrumbs,
    navigation: recordNavigation, render: recordRender, action: recordAction, error: recordError,
};
