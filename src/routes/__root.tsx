import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { TRPCReactProvider } from "~/trpc/react";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
});

function RootComponent() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });

  return (
    <TRPCReactProvider>
      <Toaster position="top-right" />
      {isFetching && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 bg-white/80 px-4 py-2 text-sm text-gray-600 shadow-sm">
          Loading...
        </div>
      )}
      <Outlet />
    </TRPCReactProvider>
  );
}

function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <p className="text-sm font-semibold text-primary uppercase">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Page Not Found</h1>
        <p className="text-gray-600 mt-2">The page you’re looking for does not exist.</p>
      </div>
    </div>
  );
}

function RootErrorComponent({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center max-w-lg">
        <p className="text-sm font-semibold text-red-600 uppercase">Error</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Something went wrong</h1>
        <p className="text-gray-600 mt-2 break-words">{error.message}</p>
      </div>
    </div>
  );
}
