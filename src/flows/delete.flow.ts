import { addKeyword } from "@builderbot/bot";
import { getCurrentCalendar, deleteCalendarEvent } from "../services/calendar";
import { format, parse, isSameDay, isEqual } from "date-fns";
import { clearHistory } from "../utils/handleHistory";

/**
 * Encargado de eliminar un evento del calendario
 */
const flowDelete = addKeyword(['eliminar', 'borrar', 'cancelar'])
    .addAction(async (_, { flowDynamic }) => {
        await flowDynamic('Por favor, proporciona la fecha de la cita que deseas eliminar (formato: yyyy-MM-dd).');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
        const dateInput = ctx.body.trim();
        const desiredDate = parse(dateInput, 'yyyy-MM-dd', new Date());

        if (isNaN(desiredDate.getTime())) {
            return fallBack('Por favor, proporciona una fecha válida en formato yyyy-MM-dd.');
        }

        await state.update({ desiredDate });
        await flowDynamic('Por favor, proporciona la hora de la cita que deseas eliminar (formato: HH:mm).');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
        const timeInput = ctx.body.trim();
        const desiredDate = state.get('desiredDate');

        const desiredDateTime = parse(`${format(desiredDate, 'yyyy-MM-dd')} ${timeInput}`, 'yyyy-MM-dd HH:mm', new Date());

        if (isNaN(desiredDateTime.getTime())) {
            return fallBack('Por favor, proporciona una hora válida en formato HH:mm.');
        }

        const appointments = await getCurrentCalendar();
        const appointment = appointments.find(appointment => isEqual(new Date(appointment.start), desiredDateTime));

        if (!appointment) {
            return flowDynamic(`No se encontró ninguna cita para el ${format(desiredDateTime, 'dd-MM-yyyy')} a las ${format(desiredDateTime, 'HH:mm')}.`);
        }

        const eventId = appointment.id;
        const description = appointment.description || '';
        const phoneInDescription = description.match(/Phone: (\d+)/)?.[1];

        if (!phoneInDescription || phoneInDescription !== ctx.from) {
            return flowDynamic('No tienes permiso para eliminar esta cita.');
        }

        await state.update({ eventId, appointmentDetails: appointment });
        await flowDynamic('¿Está seguro de que desea eliminar esta cita? Responde con "sí" o "no".');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic }) => {
        if (ctx.body.trim().toLowerCase() === 'sí' || ctx.body.trim().toLowerCase() === 'si') {
            let data: any = {};
            const eventId = state.get('eventId');
            const phone = ctx.from;

            data.eventId = eventId;
            data.phone = phone;

            // Llamar a la función para eliminar la cita pasando el payload
            await deleteCalendarEvent(data);

            clearHistory(state);
            await flowDynamic('La cita ha sido eliminada exitosamente.');
        } else {
            await flowDynamic('La cita no ha sido eliminada.');
            clearHistory(state);
        }
    });

export { flowDelete };