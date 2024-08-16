import { addKeyword } from "@builderbot/bot";
import { updateCalendarEvent, getCurrentCalendar } from "../services/calendar";
import { format, parse, isSameDay, isEqual } from "date-fns";
import { clearHistory } from "../utils/handleHistory";

const flowUpdate = addKeyword(['modificar', 'cambiar', 'rectificar', 'corregir'])
    .addAction(async (_, { flowDynamic }) => {
        await flowDynamic('Vamos a actualizar una cita. Por favor, proporciona la fecha de la cita que deseas actualizar (formato: yyyy-MM-dd).');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
        const dateInput = ctx.body.trim();
        const desiredDate = parse(dateInput, 'yyyy-MM-dd', new Date());

        if (isNaN(desiredDate.getTime())) {
            return fallBack('Por favor, proporciona una fecha válida en formato yyyy-MM-dd.');
        }

        await state.update({ desiredDate });
        await flowDynamic('Por favor, proporciona la hora de la cita que deseas actualizar (formato: HH:mm).');
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
            return flowDynamic('No tienes permiso para modificar esta cita.');
        }

        await state.update({ eventId, appointmentDetails: appointment });
        await flowDynamic('¿Qué deseas actualizar? (nombre, email, fecha/hora)');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, endFlow }) => {
        const updateField = ctx.body.toLowerCase();
        let updateData: any = {};

        switch (updateField) {
            case 'nombre':
                await flowDynamic('Por favor, proporciona el nuevo nombre.');
                await state.update({ updateField: 'name' });
                break;
            case 'email':
                await flowDynamic('Por favor, proporciona el nuevo email.');
                await state.update({ updateField: 'email' });
                break;
            case 'fecha/hora':
                await flowDynamic('Por favor, proporciona la nueva fecha y hora (formato: yyyy/MM/dd HH:mm:ss).');
                await state.update({ updateField: 'startDate' });
                break;
            default:
                await flowDynamic('Lo siento, no entendí eso. ¿Puedes repetir?');
                return endFlow();
        }
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic }) => {
        const eventId = state.get('eventId');
        const updateField = state.get('updateField');
        let updateData: any = {};

        updateData[updateField] = ctx.body.trim();

        if (updateField === 'startDate') {
            const startDate = new Date(ctx.body);
            const endData = new Date(startDate.getTime() + 55 * 60000);  // +55 minutos
            updateData.startDate = startDate;
            updateData.endData = endData;
        }

        updateData.phone = ctx.from;  // Añadir el teléfono al payload
        updateData.eventId = eventId; // Añadir el eventId al payload

        await updateCalendarEvent(updateData);
        clearHistory(state);
        await flowDynamic('La cita ha sido actualizada exitosamente.');
    });

export { flowUpdate };
