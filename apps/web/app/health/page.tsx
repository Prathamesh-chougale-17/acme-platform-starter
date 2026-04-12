import { HealthDashboard } from '@/components/health-dashboard';
import { publicEnv } from '@/lib/env';

export default function HealthPage() {
  return (
    <HealthDashboard
      environment={publicEnv.NEXT_PUBLIC_APP_ENV}
      apiBaseUrl={publicEnv.NEXT_PUBLIC_API_BASE_URL}
    />
  );
}
