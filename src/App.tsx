import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import LandingPage from './pages/LandingPage';
import AuthModalRoute from './pages/AuthModalRoute';
import AppLayout from './layouts/AppLayout';
import AppHomePage from './pages/app/AppHomePage';
import DocsLayout from './layouts/DocsLayout';
import DocSlugPage from './pages/docs/DocSlugPage';
import { Toaster } from 'react-hot-toast';

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
		children: [
			{ index: true, element: <AppHomePage /> },
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
			<Toaster />
			<RouterProvider router={router} />
		</>
	);
}

export default App;
