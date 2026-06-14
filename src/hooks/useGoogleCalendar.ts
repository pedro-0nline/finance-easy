import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
}

export function useGoogleCalendarEvents(timeMin: string, timeMax: string) {
  const { providerToken, clearGoogleToken } = useAuth();

  return useQuery({
    queryKey: ['google-calendar', timeMin, timeMax, providerToken],
    queryFn: async (): Promise<GoogleCalendarEvent[]> => {
      const params = new URLSearchParams({
        timeMin: new Date(timeMin).toISOString(),
        timeMax: new Date(timeMax).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
      });

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${providerToken}` } }
      );

      if (!res.ok) {
        if (res.status === 401) {
          clearGoogleToken();
          throw new Error('Token expirado. Faca login novamente com Google.');
        }

        // Access denied for calendar scope should not break transaction flows.
        if (res.status === 403) {
          clearGoogleToken();
          return [];
        }

        throw new Error('Falha ao buscar eventos do Google Calendar');
      }

      const data = await res.json();
      return data.items || [];
    },
    enabled: !!providerToken && !!timeMin && !!timeMax,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useIsGoogleConnected() {
  const { providerToken } = useAuth();
  return { isConnected: !!providerToken, providerToken };
}
