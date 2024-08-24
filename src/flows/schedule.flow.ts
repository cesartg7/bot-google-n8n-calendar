import { addKeyword, EVENTS } from "@builderbot/bot";
import AIClass from "../services/ai";
import { getHistoryParse, handleHistory } from "../utils/handleHistory";
import { generateTimer } from "../utils/generateTimer";
import { getCurrentCalendar } from "../services/calendar";
import { getFullCurrentDate } from "src/utils/currentDate";
import { flowConfirm } from "./confirm.flow";
import { addMinutes, isWithinInterval, format, parse, isBefore, isValid } from "date-fns";

const DURATION_MEET = process.env.DURATION_MEET ?? 55;

const PROMPT_FILTER_DATE = `
### Contexto
Eres un asistente de inteligencia artificial. Tu propósito es determinar la fecha y hora que el cliente quiere, en el formato dd-MM-yyyy HH:mm:ss.

### Fecha y Hora Actual:
{CURRENT_DAY}

### Registro de Conversación:
{HISTORY}

Asistente: "{respuesta en formato (dd-MM-yyyy HH:mm:ss)}"
`;

const generatePromptFilter = (history: string) => {
    const nowDate = getFullCurrentDate();
    const mainPrompt = PROMPT_FILTER_DATE
        .replace('{HISTORY}', history)
        .replace('{CURRENT_DAY}', nowDate);

    return mainPrompt;
};

const flowSchedule = addKeyword(EVENTS.ACTION).addAction(async (_, { extensions, state, flowDynamic, endFlow, gotoFlow }) => {
    // Revisión para evitar la repetición después de la confirmación
    const isConfirmed = state.get('isConfirmed');
    if (isConfirmed) {
        return endFlow(); // Detenemos el flujo si ya está confirmado
    }

    await flowDynamic('Dame un momento para consultar la agenda...');
    const ai = extensions.ai as AIClass;
    const history = getHistoryParse(state);
    const list = await getCurrentCalendar();

    const listParse = list.map(({ startISO, endISO }) => {
        const fromDate = new Date(startISO);
        const toDate = new Date(endISO);

        return {
            fromDate: isValid(fromDate) ? fromDate : 'Invalid Date',
            toDate: isValid(toDate) ? toDate : 'Invalid Date'
        };
    });

    console.log({ listParse });

    const promptFilter = generatePromptFilter(history);

    const { date } = await ai.desiredDateFn([
        {
            role: 'system',
            content: promptFilter
        }
    ]);

    console.log('date', date);

    const desiredDate = parse(date, 'dd-MM-yyyy HH:mm', new Date());

    console.log('desiredDate', desiredDate);

    if (!isValid(desiredDate)) {
        const m = 'La fecha proporcionada no es válida. Por favor, intenta nuevamente con un formato válido dd-MM-yyyy HH:mm.';
        await flowDynamic(m);
        await handleHistory({ content: m, role: 'assistant' }, state);
        return endFlow();
    }

    console.log('desiredDate', desiredDate);
    
    const now = new Date();
    console.log('now', now);
    if (isBefore(desiredDate, now)) {
        const m = 'No puedes crear una cita en una fecha y hora anterior a la actual. Por favor, elige otra fecha y hora.';
        await flowDynamic(m);
        await handleHistory({ content: m, role: 'assistant' }, state);
        return endFlow();
    }

    const isDateAvailable = listParse.every(({ fromDate, toDate }) => 
        fromDate !== 'Invalid Date' && toDate !== 'Invalid Date' && 
        !isWithinInterval(desiredDate, { start: fromDate, end: toDate })
    );

    if (!isDateAvailable) {
        const m = 'Lo siento, esa hora ya está reservada. ¿Alguna otra fecha y hora?';
        await flowDynamic(m);
        await handleHistory({ content: m, role: 'assistant' }, state);
        return endFlow();
    }

    const formattedDateFrom = format(desiredDate, 'hh:mm a');
    const formattedDateTo = format(addMinutes(desiredDate, +DURATION_MEET), 'hh:mm a');
    const message = `¡Perfecto! Tenemos disponibilidad de ${formattedDateFrom} a ${formattedDateTo} el día ${format(desiredDate, 'dd-MM-yyyy')}. ¿Confirmo tu reserva? *si*`;
    await handleHistory({ content: message, role: 'assistant' }, state);

    // Convertimos desiredDate a ISO para guardar en el estado
    const desiredDateISO = desiredDate.toISOString();
    await state.update({ desiredDate: desiredDateISO }); // Guardar la fecha en formato ISO

    const chunks = message.split(/(?<!\d)\.\s+/g);
    for (const chunk of chunks) {
        await flowDynamic([{ body: chunk.trim(), delay: generateTimer(150, 250) }]);
    }

}).addAction({ capture: true }, async ({ body }, { state, gotoFlow, flowDynamic }) => {
    if (body.toLowerCase().includes('si')) {
        await state.update({ isConfirmed: true }); // Marcar como confirmado en el estado
        return gotoFlow(flowConfirm); // Ir al flujo de confirmación
    }

    await flowDynamic('¿Alguna otra fecha y hora?');
    await state.update({ desiredDate: null });
});

export { flowSchedule };
