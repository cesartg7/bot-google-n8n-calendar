import { addKeyword } from "@builderbot/bot";
import { updateCalendarEvent, getCurrentCalendar } from "../services/calendar";
import { format, parse, isSameDay } from "date-fns";
import { clearHistory } from "../utils/handleHistory";

const flowUpdate = addKeyword(['modificar', 'cambiar', 'rectificar', 'corregir'])
    .addAction(async (_, { flowDynamic }) => {
        await flowDynamic('Vamos a actualizar una cita. Por favor, proporciona la fecha de la cita que deseas actualizar (formato: yyyy-MM-dd).');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {

        console.log('ESTAMOS ACTUALMENTE EN FLOWUPDATE');

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
