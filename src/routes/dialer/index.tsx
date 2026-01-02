import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dialer/")({
    component: DialerPage,
});

function DialerPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Dialer</h1>
                <p className="text-gray-600">Phone dialer feature coming soon.</p>
            </div>
        </div>
    );
}
