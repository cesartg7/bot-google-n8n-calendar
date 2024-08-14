import { addKeyword, EVENTS } from "@builderbot/bot";
import { getCurrentCalendar, deleteCalendarEvent } from "../services/calendar";
import { format, parse, isSameDay } from "date-fns";
import { clearHistory } from "../utils/handleHistory";

const flowDeleteByDate = addKeyword(EVENTS.ACTION).addAction(async (_, { flowDynamic }) => {
    await flowDynamic('Por favor, proporciona la fecha de la cita que deseas eliminar (formato: yyyy-MM-dd).');
}).addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {

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

    // Mostrar las citas al usuario
    let message = `He encontrado las siguientes citas para el ${format(desiredDate, 'dd-MM-yyyy')}:\n`;
    appointmentsOnDate.forEach((appointment, index) => {
        message += `${index + 1}. De ${format(new Date(appointment.start), 'HH:mm')} a ${format(new Date(appointment.end), 'HH:mm')}\n`;
    });

    await state.update({ appointmentsOnDate, desiredDate });
    await flowDynamic(message + '\nResponde con el número de la cita que deseas eliminar.');
})
.addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
    const choice = parseInt(ctx.body.trim(), 10);

    if (isNaN(choice) || choice < 1 || choice > state.get('appointmentsOnDate').length) {
        return fallBack('Por favor, selecciona un número válido.');
    }

    const selectedAppointment = state.get('appointmentsOnDate')[choice - 1];
    await deleteCalendarEvent(selectedAppointment.id);

    clearHistory(state);
    await flowDynamic('La cita ha sido eliminada exitosamente.');
});

export { flowDeleteByDate };
