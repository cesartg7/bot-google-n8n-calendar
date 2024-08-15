import { addKeyword } from "@builderbot/bot";
import { getCurrentCalendar, deleteCalendarEvent } from "../services/calendar";
import { format, parse, isSameDay } from "date-fns";
import { clearHistory } from "../utils/handleHistory";

/**
 * Encargado eliminar un evento del calendario
 */
const flowDeleteByDate = addKeyword(['eliminar', 'borrar', 'cancelar'])
    .addAction(async (_, { flowDynamic }) => {
        await flowDynamic('Por favor, proporciona la fecha de la cita que deseas eliminar (formato: yyyy-MM-dd).');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {

        console.log('ESTAMOS ACTUALMENTE EN FLOWDELETE');

        const dateInput = ctx.body.trim();
        console.log('dateInput', dateInput);

        const desiredDate = parse(dateInput, 'yyyy-MM-dd', new Date());
        console.log('desiredDate', desiredDate);

        if (isNaN(desiredDate.getTime())) {
            return fallBack('Por favor, proporciona una fecha válida en formato yyyy-MM-dd.');
        }

        await state.update({ desiredDate });
        await flowDynamic('Por favor, proporciona la hora de la cita que deseas eliminar (formato: HH:mm).');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
        const timeInput = ctx.body.trim();
        const desiredDate = state.get('desiredDate');

        console.log('timeInput', timeInput);

        const desiredDateTime = parse(`${format(desiredDate, 'yyyy-MM-dd')} ${timeInput}`, 'yyyy-MM-dd HH:mm', new Date());

        console.log('desiredDateTime', desiredDateTime);
        
        if (isNaN(desiredDateTime.getTime())) {
            return fallBack('Por favor, proporciona una hora válida en formato HH:mm.');
        }

        const appointments = await getCurrentCalendar();
        console.log('appointments', appointments);
        
        const appointment = appointments.find(appointment => isSameDay(new Date(appointment.start), desiredDateTime));
        console.log('appointment', appointment);

        if (!appointment) {
            return flowDynamic(`No se encontró ninguna cita para el ${format(desiredDateTime, 'dd-MM-yyyy')} a las ${format(desiredDateTime, 'HH:mm')}.`);
        }

        console.log('state antes de updatear', state);

        await state.update({ eventId: appointment.id, appointmentDetails: appointment });
        console.log('state despues de updatear', state);
        
        await flowDynamic('¿Está seguro de que desea eliminar esta cita? Responde con "sí" o "no".');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
        if (ctx.body.trim().toLowerCase() === 'sí') {
            const eventId = state.get('eventId');
            const phone = ctx.from; // Asegúrate de que `phone` se pasa correctamente

            // Llamar a la función para eliminar la cita
            await deleteCalendarEvent({ eventId, phone });

            clearHistory(state);
            await flowDynamic('La cita ha sido eliminada exitosamente.');
        } else {
            await flowDynamic('La cita no ha sido eliminada.');
            clearHistory(state);
        }
    });

export { flowDeleteByDate };
