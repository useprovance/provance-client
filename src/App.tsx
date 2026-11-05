import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import LandingPage from './pages/LandingPage';
import AuthModalRoute from './pages/AuthModalRoute';
import AppLayout from './layouts/AppLayout';
import AppHomePage from './pages/app/AppHomePage';
import MarketplacePage from './pages/app/MarketplacePage';
import RouteErrorPage, { NotFoundPage } from './pages/RouteErrorPage';
import AgentsPage from './pages/app/AgentsPage';
import WalletPage from './pages/app/WalletPage';
import WorkflowEditorPage from './pages/app/WorkflowEditorPage';
import ServiceOperationsPage from './pages/app/ServiceOperationsPage';
import ExecutionSettingsPage from './pages/app/ExecutionSettingsPage';
import DocsLayout from './layouts/DocsLayout';
import DocSlugPage from './pages/docs/DocSlugPage';
import { Toaster } from 'react-hot-toast';
import { workflowsLoader, workflowEditorLoader, agentsLoader, authLoader } from './utils/loaders.utils';

const router = createBrowserRouter([
    {path:"*",element:<NotFoundPage/>},
	{
		path: '/',
		element: <LandingPage />,
        errorElement: <RouteErrorPage />,
		children: [
			{ path: 'auth', element: <AuthModalRoute /> },
		],
	},
	{
		path: '/app',
		element: <AppLayout />,
        errorElement: <RouteErrorPage />,
		loader: authLoader,
		children: [
			{
				index: true,
				element: <AppHomePage />,
				loader: workflowsLoader,
			},
			{ path: 'agents', element: <AgentsPage />, loader: agentsLoader },
            {path:'marketplace',element:<MarketplacePage/>},
			{ path: 'wallet', element: <WalletPage /> },
			{ path: 'settings', element: <ExecutionSettingsPage /> },
            {path:'operations',element:<ServiceOperationsPage/>},
			{ path: 'workflows/:id', element: <WorkflowEditorPage />, loader: workflowEditorLoader },
            {path:'*',element:<NotFoundPage/>},
		],
	},
	{
		path: '/docs',
		element: <DocsLayout />,
        errorElement: <RouteErrorPage />,
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
