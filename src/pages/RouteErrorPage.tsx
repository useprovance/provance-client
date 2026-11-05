import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

function ErrorScreen({ notFound }: { notFound: boolean }) {
  return <div className="min-h-full flex-1 flex items-center justify-center bg-[#141414] text-white p-8">
    <div className="max-w-md text-center py-16"><p className="text-xs text-white/40 mb-3">{notFound ? '404' : 'Page unavailable'}</p><h1 className="text-2xl font-semibold">{notFound ? 'Page not found' : 'Could not load this page'}</h1><p className="mt-3 text-sm text-white/55">{notFound ? 'This address does not match a page in Provance.' : 'Try refreshing the page, or return to your workflows.'}</p><div className="mt-6 flex flex-wrap justify-center gap-4"><Link to="/app" className="bg-sand text-ink-dark px-4 py-2 rounded text-sm font-semibold">Back to workflows</Link>{!notFound && <button onClick={() => window.location.reload()} className="border border-white/20 px-4 py-2 rounded text-sm">Refresh page</button>}</div></div>
  </div>;
}
export function NotFoundPage() { return <ErrorScreen notFound />; }
export default function RouteErrorPage() {
  const error = useRouteError();
  return <ErrorScreen notFound={isRouteErrorResponse(error) && error.status === 404} />;
}
