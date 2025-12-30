import { useTenantContext } from '@/contexts/TenantContext';

export const useTenant = () => {
    const context = useTenantContext();
    return context;
};
