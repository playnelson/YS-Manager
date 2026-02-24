
import { UserEvent } from '../types';

export const fetchGoogleCalendarEvents = async (accessToken: string): Promise<UserEvent[]> => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events');
    }

    const data = await response.json();
    
    return (data.items || []).map((item: any) => ({
      id: `google_${item.id}`,
      title: item.summary || '(Sem título)',
      date: item.start?.date || item.start?.dateTime?.split('T')[0] || '',
      time: item.start?.dateTime ? item.start.dateTime.split('T')[1].substring(0, 5) : '',
      type: 'meeting',
      description: `Google Calendar: ${item.description || ''}`
    }));
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return [];
  }
};
