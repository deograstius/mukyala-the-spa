import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@utils/api';

export type AvailabilityParams = {
  locationId?: string;
  serviceSlug?: string;
  date?: string; // YYYY-MM-DD in location timezone
};

export function useAvailabilityQuery(params: AvailabilityParams) {
  const { locationId, serviceSlug, date } = params;
  const enabled = Boolean(locationId && serviceSlug && date);
  return useQuery({
    queryKey: ['availability', locationId, serviceSlug, date],
    queryFn: async (): Promise<{ timezone: string; slots: string[] }> => {
      const path = `/v1/locations/${locationId}/services/${serviceSlug}/availability?date=${date}`;
      return apiGet(path);
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

