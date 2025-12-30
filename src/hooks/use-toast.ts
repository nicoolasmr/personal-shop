import { toast as sonnerToast } from "sonner";

/**
 * Modern toast hook mapping to Sonner for premium look and feel.
 * This replaces the previous console.log shim.
 */

export const toast = ({
    title,
    description,
    variant = 'default'
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive'
}) => {
    if (variant === 'destructive') {
        sonnerToast.error(title, {
            description,
        });
    } else {
        sonnerToast.success(title, {
            description,
        });
    }
};

export const useToast = () => {
    return {
        toast,
        dismiss: () => sonnerToast.dismiss(),
        // shadcn compatibility
        success: (title: string, description?: string) => sonnerToast.success(title, { description }),
        error: (title: string, description?: string) => sonnerToast.error(title, { description }),
    };
};
