import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * NavigationTracker: Simple component to scroll to top on navigation.
 * Can be expanded to track analytics in the future.
 */
export const NavigationTracker = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};
