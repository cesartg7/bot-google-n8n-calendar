import { addKeyword } from "@builderbot/bot";
import { updateCalendarEvent, getCurrentCalendar } from "../services/calendar";
import { format, parse, isSameDay, isEqual, isValid, isBefore } from "date-fns";
import { clearHistory } from "../utils/handleHistory";

const flowUpdate = addKeyword(['modificar', 'cambiar', 'rectificar', 'corregir'])
    .addAction(async (_, { flowDynamic }) => {
        await flowDynamic('Vamos a actualizar una cita. Por favor, proporciona la fecha de la cita que deseas actualizar (formato: dd-MM-yyyy).');
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
        try {
            const dateInput = ctx.body.trim();
            const desiredDate = parse(dateInput, 'yyyy-MM-dd', new Date());

            if (isNaN(desiredDate.getTime()) || !isValid(desiredDate)) {
                return fallBack('Por favor, proporciona una fecha válida en formato yyyy-MM-dd.');
            }

            const now = new Date();
            if (isBefore(desiredDate, now)) {
                return fallBack('No puedes actualizar una cita a una fecha anterior a hoy. Por favor, proporciona una nueva fecha.');
            }

            await state.update({ desiredDate });
            await flowDynamic('Por favor, proporciona la hora de la cita que deseas actualizar (formato: HH:mm).');

        } catch (error) {
            console.error('Error al procesar la fecha:', error);
            return fallBack('La fecha proporcionada no es válida. Por favor, intenta nuevamente con un formato válido yyyy-MM-dd.');
        }
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
        try {
            const timeInput = ctx.body.trim();
            const desiredDate = state.get('desiredDate');

            const desiredDateTime = parse(`${format(desiredDate, 'yyyy-MM-dd')} ${timeInput}`, 'yyyy-MM-dd HH:mm', new Date());

            if (isNaN(desiredDateTime.getTime()) || !isValid(desiredDateTime)) {
                return fallBack('Por favor, proporciona una hora válida en formato HH:mm (Horas minutos).');
            }

            const now = new Date();
            if (isBefore(desiredDateTime, now)) {
                return fallBack('No puedes actualizar una cita a una hora anterior a la actual. Por favor, proporciona una nueva hora.');
            }

            const appointments = await getCurrentCalendar();
            const appointment = appointments.find(appointment => isEqual(new Date(appointment.start), desiredDateTime));

            if (!appointment) {
                return flowDynamic(`No se encontró ninguna cita para el ${format(desiredDateTime, 'dd-MM-yyyy')} a las ${format(desiredDateTime, 'HH:mm')}.`);
            }

            // Evitar que el usuario ponga la misma fecha y hora
            if (isEqual(new Date(appointment.start), desiredDateTime)) {
                return fallBack('La nueva fecha y hora son iguales a las actuales. Proporciona una fecha y hora diferentes.');
            }

            const eventId = appointment.id;
            const description = appointment.description || '';
            const phoneInDescription = description.match(/Phone: (\d+)/)?.[1];

            if (!phoneInDescription || phoneInDescription !== ctx.from) {
                return flowDynamic('No tienes permiso para modificar esta cita.');
            }

            await state.update({ eventId, appointmentDetails: appointment });
            await flowDynamic('¿Qué deseas actualizar? (nombre, email, fecha)');

        } catch (error) {
            console.error('Error al procesar la hora:', error);
            return fallBack('La hora proporcionada no es válida. Por favor, intenta nuevamente con un formato válido HH:mm.');
        }

    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, endFlow, fallBack }) => {
        try {
            const updateField = ctx.body.toLowerCase();
            let updateData: any = {};

            switch (updateField) {
                case 'nombre':
                    await flowDynamic('Por favor, proporciona el nuevo nombre.');
                    await state.update({ updateField: 'name' });
                    break;
                case 'email':
                case 'correo':
                case 'mail':
                    await flowDynamic('Por favor, proporciona el nuevo email.');
                    await state.update({ updateField: 'email' });
                    break;
                case 'fecha/hora':
                case 'fecha':
                case 'fecha / hora':
                    await flowDynamic('Por favor, proporciona la nueva fecha y hora (formato: yyyy-MM-dd HH:mm).');
                    await state.update({ updateField: 'startDate', updatingDate: true });
                    break;
                default:
                    await flowDynamic('Lo siento, no entendí eso. ¿Puedes repetir?');
                    return endFlow();
            }
        } catch (error) {
            console.error('Error en la captura de campo de actualización:', error);
            return fallBack('Se ha producido un error al procesar tu solicitud. Por favor, intenta nuevamente.');
        }
    })
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
        try {
            let updateData: any = state.get('appointmentDetails');
            const updateField = state.get('updateField');
            const updatingDate = state.get('updatingDate');

            if (updatingDate) {
                const dateInput = ctx.body.trim();
                const desiredDate = parse(dateInput, 'yyyy-MM-dd', new Date());

                if (isNaN(desiredDate.getTime()) || !isValid(desiredDate)) {
                    return flowDynamic('Por favor, proporciona una fecha válida en formato yyyy-MM-dd.');
                }

                const now = new Date();
                if (isBefore(desiredDate, now)) {
                    return flowDynamic('No puedes actualizar la cita a una fecha anterior a hoy. Por favor, proporciona una nueva fecha.');
                }

                await state.update({ desiredDate });
                await flowDynamic('Por favor, proporciona la nueva hora de la cita (formato: HH:mm).');
            } else if (updateField === 'startDate') {
                const desiredDate = state.get('desiredDate');
                const timeInput = ctx.body.trim();
                const startDate = parse(`${format(desiredDate, 'yyyy-MM-dd')} ${timeInput}`, 'yyyy-MM-dd HH:mm', new Date());

                if (isNaN(startDate.getTime()) || !isValid(startDate)) {
                    return flowDynamic('Por favor, proporciona una hora válida en formato HH:mm.');
                }

                const now = new Date();
                if (isBefore(startDate, now)) {
                    return flowDynamic('No puedes actualizar la cita a una hora anterior a la actual. Por favor, proporciona una nueva hora.');
                }

                const endData = new Date(startDate.getTime() + 55 * 60000);  // +55 minutos
                updateData.startDate = startDate;
                updateData.endData = endData;

                updateData.phone = ctx.from;  // Añadir el teléfono al payload
                updateData.eventId = state.get('eventId'); // Añadir el eventId al payload

                await updateCalendarEvent(updateData);
                clearHistory(state);

                const formattedDate = format(updateData.startDate, 'dd-MM-yyyy');
                await flowDynamic(`Cita actualizada con éxito:\nFecha: ${formattedDate}\nNombre: ${updateData.name}\nEmail: ${updateData.email}\n\nMuchas gracias, que tengas un buen día`);
            } else {
                updateData[updateField] = ctx.body.trim();
                updateData.phone = ctx.from;
                updateData.eventId = state.get('eventId');

                await updateCalendarEvent(updateData);
                clearHistory(state);

                const formattedDate = format(updateData.startDate, 'dd-MM-yyyy');
                await flowDynamic(`Cita actualizada con éxito:\nFecha: ${formattedDate}\nNombre: ${updateData.name}\nEmail: ${updateData.email}\n\nMuchas gracias, que tengas un buen día`);
            }

        } catch (error) {
            console.error('Error en la actualización de la cita:', error);
            return fallBack('Se ha producido un error al actualizar la cita. Por favor, intenta nuevamente.');
        }
    });

export { flowUpdate };
