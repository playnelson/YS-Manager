
import { Contact } from '../types';

export const fetchGoogleContacts = async (accessToken: string): Promise<Contact[]> => {
    try {
        const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses,photos', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Google Contacts');
        }

        const data = await response.json();

        return (data.connections || []).map((person: any) => {
            const name = person.names?.[0]?.displayName || 'Sem nome';
            // Pegamos o primeiro número de telefone que tiver
            const phone = person.phoneNumbers?.[0]?.value || '';
            const email = person.emailAddresses?.[0]?.value || '';
            const photoUrl = person.photos?.[0]?.url || '';

            return {
                id: person.resourceName,
                name,
                phone,
                email,
                photoUrl,
                source: 'google'
            };
        }).filter((c: Contact) => c.phone); // Apenas contatos com telefone para o WhatsApp
    } catch (error) {
        console.error('Error fetching Google Contacts:', error);
        return [];
    }
};
