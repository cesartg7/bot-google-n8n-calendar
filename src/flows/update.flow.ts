import { addKeyword, EVENTS } from "@builderbot/bot";
import { updateCalendarEvent } from "../services/calendar";
import { clearHistory } from "../utils/handleHistory";

const flowUpdate = addKeyword(EVENTS.ACTION).addAction(async (_, { flowDynamic }) => {
    await flowDynamic('Vamos a actualizar una cita. Por favor, proporciona el ID de la cita que deseas actualizar.');
}).addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack, endFlow }) => {

    const id = ctx.body.trim();

    if (!id) {
        return fallBack('Por favor, proporciona un ID válido.');
    }

    await state.update({ eventId: id });
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
        const endData = new Date(startDate.getTime() + 55 * 60000);  // +45 minutos
        updateData.startDate = startDate;
        updateData.endData = endData;
    }

    await updateCalendarEvent(eventId, updateData);
    clearHistory(state);
    await flowDynamic('La cita ha sido actualizada exitosamente.');
});

export { flowUpdate };
