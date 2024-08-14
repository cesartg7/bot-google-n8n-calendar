import { N8N_ADD_TO_CALENDAR, N8N_GET_FROM_CALENDAR, N8N_UPDATE_TO_CALENDAR, N8N_DELETE_FROM_CALENDAR } from 'src/config'

/**
 * get calendar
 * @returns 
 */
const getCurrentCalendar = async (): Promise<{ start: string, end: string }[]> => {
    const dataCalendarApi = await fetch(N8N_GET_FROM_CALENDAR)
    const json: { start: { dateTime: string }, end: { dateTime: string } }[] = await dataCalendarApi.json()
    const list = json.reduce((prev, current) => {
        prev.push({ start: current.start.dateTime, end: current.end.dateTime })
        return prev
    }, [])
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
 * @param payload 
 * @returns 
 */
const deleteCalendarEvent = async (payload: { eventId: string, phone?: string, [key: string]: any }) => {
    try {
        const response = await fetch(N8N_DELETE_FROM_CALENDAR, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)  // Enviar todo el payload
        });

        if (!response.ok) {
            throw new Error('Failed to delete event');
        }

        return response; // Puedes devolver la respuesta o un mensaje de éxito
    } catch (err) {
        console.log(`error: `, err);
        throw new Error('Error al eliminar la cita.');
    }
};


export { getCurrentCalendar, appToCalendar, updateCalendarEvent, deleteCalendarEvent }