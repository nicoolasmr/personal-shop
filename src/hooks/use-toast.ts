
// Simple shim for use-toast to avoid errors until full component is added
// This will likely be replaced by the real shadcn/ui toaster later.
export const toast = (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    console.log(`[Toast] ${props.title}: ${props.description || ''}`);
};

export const useToast = () => ({ toast });
