import { N8N_ADD_TO_CALENDAR, N8N_GET_FROM_CALENDAR, N8N_UPDATE_TO_CALENDAR, N8N_DELETE_FROM_CALENDAR } from 'src/config'

/**
 * get calendar
 * @returns 
 */
const getCurrentCalendar = async (): Promise<{ id: string, start: string, end: string }[]> => {
    const dataCalendarApi = await fetch(N8N_GET_FROM_CALENDAR)
    const json: { id: string, start: { dateTime: string }, end: { dateTime: string } }[] = await dataCalendarApi.json()
    const list = json.reduce((prev, current) => {
        prev.push({ id: current.id, start: current.start.dateTime, end: current.end.dateTime })
        return prev
    }, [])

    console.log('ESTAMOS EN EL METODO GETCURRENTCALENDAR A VER QUE DEVUELVE:');
    console.log('json', json);
    console.log('list', list);
    
    return list
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
}

/**
 * update calendar event
 * @param eventId 
 * @param payload 
 * @returns 
 */
const updateCalendarEvent = async (payload: { eventId: string, name?: string, email?: string, startDate?: Date, endData?: Date, phone?: string }) => {
    try {

        const dataApi = await fetch(N8N_UPDATE_TO_CALENDAR, {
            method: 'PUT', // Usualmente se usa PUT o PATCH para actualizaciones
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        });

        if (!dataApi.ok) {
            throw new Error('Failed to update event');
        }

        return dataApi;
    } catch (err) {
        console.log(`Error: `, err);
        throw new Error('Error al actualizar la cita.');
    }
};

/**
* Delete calendar event
* @param eventId 
* @param phone 
* @returns 
*/
const deleteCalendarEvent = async ({ eventId, phone }: { eventId: string, phone: string }) => {
   try {
       console.log(`Eliminando evento con ID: ${eventId} y Phone: ${phone}`);

       const dataApi = await fetch(N8N_DELETE_FROM_CALENDAR, {
           method: 'DELETE', // Método DELETE para eliminar
           headers: {
               "Content-Type": "application/json",
           },
           body: JSON.stringify({ eventId, phone }) // Asegúrate de enviar el eventId y phone
       });

       if (!dataApi.ok) {
           throw new Error('Failed to delete event');
       }

       const response = await dataApi.json();
       console.log('Respuesta del servidor:', response);

       return response;
   } catch (err) {
       console.log(`Error al eliminar la cita: `, err);
       throw new Error('Error al eliminar la cita.');
   }
};

export { getCurrentCalendar, appToCalendar, updateCalendarEvent, deleteCalendarEvent }