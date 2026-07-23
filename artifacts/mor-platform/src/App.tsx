import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { RoleProvider } from '@/contexts/role-context';
import { Shell } from '@/components/layout/Shell';

// Pages
import RoleSelector from '@/pages/role-selector';
import Dashboard from '@/pages/researcher/dashboard';
import Jobs from '@/pages/researcher/jobs';
import NewJob from '@/pages/researcher/new-job';
import JobDetail from '@/pages/researcher/job-detail';
import Schedule from '@/pages/researcher/schedule';
import Resources from '@/pages/researcher/resources';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminNodes from '@/pages/admin/nodes';
import AdminJobs from '@/pages/admin/jobs';
import AdminUsers from '@/pages/admin/users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
});

// Flat page wrappers — avoids wouter nested-router context issues
// that arise when using path="/prefix*" component grouping.
function DashboardPage()      { return <Shell><Dashboard /></Shell>; }
function JobsPage()            { return <Shell><Jobs /></Shell>; }
function NewJobPage()          { return <Shell><NewJob /></Shell>; }
function JobDetailPage()       { return <Shell><JobDetail /></Shell>; }
function SchedulePage()        { return <Shell><Schedule /></Shell>; }
function ResourcesPage()       { return <Shell><Resources /></Shell>; }
function AdminDashboardPage()  { return <Shell><AdminDashboard /></Shell>; }
function AdminNodesPage()      { return <Shell><AdminNodes /></Shell>; }
function AdminJobsPage()       { return <Shell><AdminJobs /></Shell>; }
function AdminUsersPage()      { return <Shell><AdminUsers /></Shell>; }

function Router() {
  return (
    <Switch>
      <Route path="/" component={RoleSelector} />

      {/* Admin routes — listed before researcher catch-alls */}
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/nodes" component={AdminNodesPage} />
      <Route path="/admin/jobs" component={AdminJobsPage} />
      <Route path="/admin/users" component={AdminUsersPage} />

      {/* Researcher routes */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/jobs/new" component={NewJobPage} />
      <Route path="/jobs/:id" component={JobDetailPage} />
      <Route path="/jobs" component={JobsPage} />
      <Route path="/schedule" component={SchedulePage} />
      <Route path="/resources" component={ResourcesPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}

export default App;
