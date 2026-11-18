import './App.css';
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import LandingPage from './pages/LandingPage';
import AuthModalRoute from './pages/AuthModalRoute';
import AppLayout from './layouts/AppLayout';
const AppHomePage = lazy(() => import('./pages/app/AppHomePage'));
const AgentsPage = lazy(() => import('./pages/app/AgentsPage'));
const WalletPage = lazy(() => import('./pages/app/WalletPage'));
const CredentialsPage = lazy(() => import('./pages/app/CredentialsPage'));
const NewChatPage = lazy(() => import('./pages/app/NewChatPage'));
const ChatPage = lazy(() => import('./pages/app/ChatPage'));
const WorkflowEditorPage = lazy(() => import('./pages/app/WorkflowEditorPage'));
const DocSlugPage = lazy(() => import('./pages/docs/DocSlugPage'));
import DocsLayout from './layouts/DocsLayout';
import { Toaster } from 'react-hot-toast';
import { workflowsLoader, workflowEditorLoader, agentsLoader, authLoader, credentialsLoader, chatLoader } from './utils/loaders.utils';

function LazyPage({ children }: { children: ReactNode }) {
	return (
		<Suspense fallback={<div className="px-6 py-10 text-[12px] text-white/40">Loading…</div>}>
			{children}
		</Suspense>
	);
}

const router = createBrowserRouter([
	{
		path: '/',
		element: <LandingPage />,
		children: [
			{ path: 'auth', element: <AuthModalRoute /> },
		],
	},
	{
		path: '/app',
		element: <AppLayout />,
		loader: authLoader,
		children: [
			{
				index: true,
				element: <LazyPage><AppHomePage /></LazyPage>,
				loader: workflowsLoader,
			},
			{ path: 'agents', element: <LazyPage><AgentsPage /></LazyPage>, loader: agentsLoader },
			{ path: 'wallet', element: <LazyPage><WalletPage /></LazyPage> },
			{ path: 'credentials', element: <LazyPage><CredentialsPage /></LazyPage>, loader: credentialsLoader },
			{ path: 'chat', element: <LazyPage><NewChatPage /></LazyPage> },
			{ path: 'chat/:id', element: <LazyPage><ChatPage /></LazyPage>, loader: chatLoader },
			{ path: 'workflows/:id', element: <LazyPage><WorkflowEditorPage /></LazyPage>, loader: workflowEditorLoader },
		],
	},
	{
		path: '/docs',
		element: <DocsLayout />,
		children: [
			{ index: true, element: <Navigate to="/docs/introduction" replace /> },
			{ path: ':slug', element: <LazyPage><DocSlugPage /></LazyPage> },
		],
	},
]);

function App() {
	return (
		<>
			<Toaster
				position="bottom-right"
				toastOptions={{
					style: {
						background: "#1a1a1a",
						color: "#ffffff",
						border: "1px solid rgba(255,255,255,0.08)",
						fontSize: "13px",
					},
				}}
			/>
			<RouterProvider router={router} />
		</>
	);
}

export default App;
