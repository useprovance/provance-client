import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import LandingPage from './pages/LandingPage';
import AuthModalRoute from './pages/AuthModalRoute';
import AppLayout from './layouts/AppLayout';
import AppHomePage from './pages/app/AppHomePage';
import AgentsPage from './pages/app/AgentsPage';
import WalletPage from './pages/app/WalletPage';
import WorkflowEditorPage from './pages/app/WorkflowEditorPage';
import DocsLayout from './layouts/DocsLayout';
import DocSlugPage from './pages/docs/DocSlugPage';
import { Toaster } from 'react-hot-toast';
import { workflowsLoader, workflowEditorLoader, agentsLoader, authLoader } from './utils/loaders.utils';

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
				element: <AppHomePage />,
				loader: workflowsLoader,
			},
			{ path: 'agents', element: <AgentsPage />, loader: agentsLoader },
			{ path: 'wallet', element: <WalletPage /> },
			{ path: 'workflows/:id', element: <WorkflowEditorPage />, loader: workflowEditorLoader },
		],
	},
	{
		path: '/docs',
		element: <DocsLayout />,
		children: [
			{ index: true, element: <Navigate to="/docs/introduction" replace /> },
			{ path: ':slug', element: <DocSlugPage /> },
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
