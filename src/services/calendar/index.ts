import { N8N_ADD_TO_CALENDAR, N8N_GET_FROM_CALENDAR, N8N_UPDATE_TO_CALENDAR, N8N_DELETE_FROM_CALENDAR } from 'src/config'
import { format, parseISO, isValid } from "date-fns";

/**
 * get calendar
 * @returns 
 */
const getCurrentCalendar = async (): Promise<{ id: string, start: string, end: string, description: string, name: string, email: string }[]> => {
    const dataCalendarApi = await fetch(N8N_GET_FROM_CALENDAR);
    const json: { id: string, start: { dateTime: string }, end: { dateTime: string }, description: string,  name: string, email: string }[] = await dataCalendarApi.json();
    
    const list = json.map(event => {
        console.log('event.start.dateTime', event.start.dateTime);
        console.log('event.end.dateTime', event.end.dateTime);
        const startDate = parseISO(event.start.dateTime);
        const endDate = parseISO(event.end.dateTime);
        console.log('startDate', startDate);
        console.log('endDate', endDate);

        // Verificar si las fechas son válidas antes de formatearlas
        const formattedStartDate = isValid(startDate) ? format(startDate, 'dd-MM-yyyy HH:mm') : 'Invalid Date';
        const formattedEndDate = isValid(endDate) ? format(endDate, 'dd-MM-yyyy HH:mm') : 'Invalid Date';

        console.log('isValid(startDate)', isValid(startDate));
        console.log('isValid(endDate)', isValid(endDate));

        console.log("format(startDate, 'dd-MM-yyyy HH:mm')", format(startDate, 'dd-MM-yyyy HH:mm'));
        console.log("format(endDate, 'dd-MM-yyyy HH:mm')", format(endDate, 'dd-MM-yyyy HH:mm'));

        console.log('formattedStartDate', formattedStartDate);
        console.log('formattedStartDate', formattedStartDate);


        return {
            id: event.id,
            start: formattedStartDate,
            end: formattedEndDate,
            description: event.description || '',
            name: event.name || '',
            email: event.email || '',
        };
    });

    console.log('list', list);
    
    return list;
}


/**
 * add to calendar
 * @param body 
 * @returns 
 */
const appToCalendar = async (payload: { name: string, email: string, startDate: Date, endData: Date, phone: string }) => {
    try {
        const dataApi = await fetch(N8N_ADD_TO_CALENDAR, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        })
        return dataApi
    } catch (err) {
        console.log(`error: `, err)
    }
};

/**
 * update calendar event
 * @param eventId 
 * @param payload 
 * @returns 
 */
const updateCalendarEvent = async (payload: { eventId: string, name?: string, email?: string, startDate?: Date, endData?: Date, phone?: string }) => {
    try {
        const dataApi = await fetch(N8N_UPDATE_TO_CALENDAR, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        });

        if (!dataApi.ok) {
            throw new Error('Error al actualizar la cita.');
        }

        return dataApi;
    } catch (err) {
        throw new Error('Error al actualizar la cita.');
    }
};

/**
* Delete calendar event
* @param eventId 
* @param phone 
* @returns 
*/
const deleteCalendarEvent = async (payload: { eventId: string, phone: string }) => {
    try {
        const dataApi = await fetch(N8N_DELETE_FROM_CALENDAR, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        });

        if (!dataApi.ok) {
            throw new Error('Error al eliminar la cita.');
        }

        return dataApi;
    } catch (err) {
        throw new Error('Error al eliminar la cita.');
    }
};

export { getCurrentCalendar, appToCalendar, updateCalendarEvent, deleteCalendarEvent }