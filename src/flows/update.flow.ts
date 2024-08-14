import { addKeyword, EVENTS } from "@builderbot/bot";
import { updateCalendarEvent, getCurrentCalendar } from "../services/calendar";
import { format, parse, isSameDay } from "date-fns";
import { clearHistory } from "../utils/handleHistory";

const flowUpdate = addKeyword(EVENTS.ACTION)
    .addAction(async (_, { flowDynamic }) => {
        await flowDynamic('Vamos a actualizar una cita. Por favor, proporciona la fecha de la cita que deseas actualizar (formato: yyyy-MM-dd).');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {

        const dateInput = ctx.body.trim();
        const desiredDate = parse(dateInput, 'yyyy-MM-dd', new Date());

        if (isNaN(desiredDate.getTime())) {
            return fallBack('Por favor, proporciona una fecha válida en formato yyyy-MM-dd.');
        }

        const appointments = await getCurrentCalendar();
        const appointmentsOnDate = appointments.filter(appointment => isSameDay(new Date(appointment.start), desiredDate));

        if (appointmentsOnDate.length === 0) {
            return flowDynamic(`No se encontraron citas para el ${format(desiredDate, 'dd-MM-yyyy')}.`);
        }
        
        // Aquí se genera un "pseudo-id" combinando start y end
        const appointmentId = `${appointmentsOnDate[0].start}_${appointmentsOnDate[0].end}`;
        
        await state.update({ eventId: appointmentId, appointmentDetails: appointmentsOnDate[0] });
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
