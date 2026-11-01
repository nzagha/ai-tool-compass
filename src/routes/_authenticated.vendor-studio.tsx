import { createFileRoute, Outlet } from '@tanstack/react-router';
import { meta } from '@/lib/meta';

export const Route = createFileRoute('/_authenticated/vendor-studio')({
  head: () => meta('Vendor studio', 'Manage the AI tools you own on aiBean, review activity and see request status.'),
  component: Outlet,
});
