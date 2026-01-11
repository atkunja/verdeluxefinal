import { useEffect } from "react";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
}

export function SEO({
    title = "Cleaning Business | Premium Residential Cleaning Services",
    description = "Cleaning Business provides high-end residential cleaning with absolute attention to detail.",
    keywords = "cleaning services, luxury cleaning, residential cleaning"
}: SEOProps) {
    useEffect(() => {
        document.title = title;

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', description);

        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.setAttribute('name', 'keywords');
            document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', keywords);
    }, [title, description, keywords]);

    return null;
}
