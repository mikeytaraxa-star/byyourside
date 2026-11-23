// Offline Even Hub entry; no website/server modules or credentials enter this bundle.
import { createRoot } from 'react-dom/client';
import { createRootRoute, createRouter, createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { G2App } from '../src/components/g2/G2App';
const root = document.getElementById('root');
if (!root) throw new Error('ByYourSide root element missing');
const routeTree = createRootRoute({ component: () => <G2App logoUrl="./logo.png" /> });
const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) });
createRoot(root).render(<RouterProvider router={router} />);
