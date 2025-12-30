import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOConfig {
    title?: string;
    description?: string;
    canonical?: string;
    jsonLd?: Record<string, unknown>;
    noIndex?: boolean;
}

const BASE_TITLE = "VIDA360";
const DEFAULT_DESCRIPTION = "Gerencie metas, hábitos, tarefas e finanças em um só lugar.";

// Route-specific SEO configurations
const routeSEO: Record<string, SEOConfig> = {
    "/": {
        title: "VIDA360 - Gestão de Vida Pessoal",
        description: DEFAULT_DESCRIPTION,
    },
    "/login": {
        title: "Entrar | VIDA360",
        description: "Entre na sua conta VIDA360 para gerenciar metas, hábitos e finanças.",
    },
    "/signup": {
        title: "Cadastre-se | VIDA360",
        description: "Crie sua conta gratuita no VIDA360 e comece a gerenciar sua vida pessoal.",
    },
    "/status": {
        title: "Status do Sistema | VIDA360",
        description: "Verifique o status e a saúde do sistema VIDA360.",
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "VIDA360",
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Web",
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "BRL",
            },
        },
    },
    "/health": {
        title: "Health Check | VIDA360",
        description: "Endpoint de monitoramento de saúde do VIDA360.",
        noIndex: true,
    },
    "/app/home": {
        title: "Início | VIDA360",
        description: "Painel principal com resumo de metas, hábitos e progresso.",
    },
    "/app/goals": {
        title: "Metas | VIDA360",
        description: "Gerencie suas metas pessoais e acompanhe seu progresso.",
    },
    "/app/tasks": {
        title: "Tarefas | VIDA360",
        description: "Organize suas tarefas com quadro Kanban e prioridades.",
    },
    "/app/finance": {
        title: "Finanças | VIDA360",
        description: "Controle suas finanças, transações e metas financeiras.",
    },
    "/app/calendar": {
        title: "Calendário | VIDA360",
        description: "Visualize hábitos e tarefas no calendário.",
    },
    "/app/stats": {
        title: "Estatísticas | VIDA360",
        description: "Análise detalhada do seu progresso e evolução.",
    },
    "/app/profile": {
        title: "Perfil | VIDA360",
        description: "Gerencie seu perfil e conquistas.",
    },
    "/app/settings": {
        title: "Configurações | VIDA360",
        description: "Ajuste preferências e configurações do app.",
    },
};

/**
 * Hook to manage SEO meta tags dynamically per route.
 * Updates document title, meta description, canonical URL, and JSON-LD.
 */
export function useSEO(customConfig?: SEOConfig) {
    const location = useLocation();

    useEffect(() => {
        const pathname = location.pathname;
        const config = customConfig || routeSEO[pathname] || {};

        // Update title
        const title = config.title || `${BASE_TITLE}`;
        document.title = title;

        // Update or create meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement("meta");
            metaDescription.setAttribute("name", "description");
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute("content", config.description || DEFAULT_DESCRIPTION);

        // Update or create canonical link
        let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (!canonicalLink) {
            canonicalLink = document.createElement("link");
            canonicalLink.setAttribute("rel", "canonical");
            document.head.appendChild(canonicalLink);
        }
        const canonicalUrl = config.canonical || `${window.location.origin}${pathname}`;
        canonicalLink.setAttribute("href", canonicalUrl);

        // Handle noindex
        let robotsMeta = document.querySelector('meta[name="robots"]');
        if (config.noIndex) {
            if (!robotsMeta) {
                robotsMeta = document.createElement("meta");
                robotsMeta.setAttribute("name", "robots");
                document.head.appendChild(robotsMeta);
            }
            robotsMeta.setAttribute("content", "noindex, nofollow");
        } else if (robotsMeta) {
            robotsMeta.remove();
        }

        // Update or create JSON-LD
        const existingJsonLd = document.querySelector('script[type="application/ld+json"][data-seo]');
        if (config.jsonLd) {
            if (existingJsonLd) {
                existingJsonLd.textContent = JSON.stringify(config.jsonLd);
            } else {
                const jsonLdScript = document.createElement("script");
                jsonLdScript.setAttribute("type", "application/ld+json");
                jsonLdScript.setAttribute("data-seo", "true");
                jsonLdScript.textContent = JSON.stringify(config.jsonLd);
                document.head.appendChild(jsonLdScript);
            }
        } else if (existingJsonLd) {
            existingJsonLd.remove();
        }

        // Cleanup on unmount
        return () => {
            // Reset to defaults when leaving route
            const jsonLd = document.querySelector('script[type="application/ld+json"][data-seo]');
            if (jsonLd) jsonLd.remove();
        };
    }, [location.pathname, customConfig]);
}

export default useSEO;
