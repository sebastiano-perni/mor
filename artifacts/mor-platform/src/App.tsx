import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import RoleSelector from '@/pages/role-selector';
import { Shell } from '@/components/layout/Shell';

// Researcher pages
import Dashboard from '@/pages/researcher/dashboard';
import Jobs from '@/pages/researcher/jobs';
import NewJob from '@/pages/researcher/new-job';
import JobDetail from '@/pages/researcher/job-detail';
import Schedule from '@/pages/researcher/schedule';
import Resources from '@/pages/researcher/resources';

// Admin pages
import AdminDashboard from '@/pages/admin/dashboard';
import AdminNodes from '@/pages/admin/nodes';
import AdminJobs from '@/pages/admin/jobs';
import AdminUsers from '@/pages/admin/users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 min
    },
  },
});

function ResearcherRoutes() {
  return (
    <Shell>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/jobs/new" component={NewJob} />
        <Route path="/jobs/:id" component={JobDetail} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/resources" component={Resources} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function AdminRoutes() {
  return (
    <Shell>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/nodes" component={AdminNodes} />
        <Route path="/admin/jobs" component={AdminJobs} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RoleSelector} />
      <Route path="/admin*" component={AdminRoutes} />
      <Route path="/:rest*" component={ResearcherRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
