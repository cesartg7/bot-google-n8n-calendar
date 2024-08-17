import { N8N_ADD_TO_CALENDAR, N8N_GET_FROM_CALENDAR, N8N_UPDATE_TO_CALENDAR, N8N_DELETE_FROM_CALENDAR } from 'src/config'

/**
 * get calendar
 * @returns 
 */
const getCurrentCalendar = async (): Promise<{ id: string, start: string, end: string, description: string }[]> => {
    const dataCalendarApi = await fetch(N8N_GET_FROM_CALENDAR);
    const json: { id: string, start: { dateTime: string }, end: { dateTime: string }, description: string }[] = await dataCalendarApi.json();
    const list = json.map(event => ({
        id: event.id,
        start: event.start.dateTime,
        end: event.end.dateTime,
        description: event.description || ''  // Incluimos la descripción si está disponible
    }));
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

// /**
//  * Get specific calendar event
//  * @param eventId 
//  * @returns 
//  */
// const getCurrentEvent = async (eventId: string) => {
//     try {
//         const response = await fetch(N8N_GET_EVENT, {
//             method: 'POST', // Cambiamos a POST para enviar el body
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ eventId }) 
//         });

//         if (!response.ok) {
//             throw new Error('Failed to fetch event');
//         }

//         const event = await response.json();

//         return event;
//     } catch (err) {
//         throw new Error('Error fetching event.');
//     }
// };

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
           body: JSON.stringify({ payload }) // Asegúrate de enviar el eventId y phone
       });

       if (!dataApi.ok) {
           throw new Error('Failed to delete event');
       }

       return dataApi;
   } catch (err) {
       throw new Error('Error al eliminar la cita.');
   }
};

export { getCurrentCalendar, appToCalendar, updateCalendarEvent, deleteCalendarEvent }