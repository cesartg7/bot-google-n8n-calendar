import { BotContext, BotMethods } from "@builderbot/bot/dist/types";
import { getHistoryParse } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { flowSeller } from "../flows/seller.flow";
import { flowSchedule } from "../flows/schedule.flow";
import { flowUpdate } from "../flows/update.flow";
import { flowDelete } from "../flows/delete.flow";

const PROMPT_DISCRIMINATOR = `### Historial de Conversación (Vendedor/Cliente) ###
{HISTORY}

### Intenciones del Usuario ###

**HABLAR**: Selecciona esta acción si el cliente parece necesitar más información sobre el negocio, servicio o informarse del horario de atención.
**PROGRAMAR**: Selecciona esta acción únicamente cuando el cliente determine la hora y fecha para programar una cita.
**MODIFICAR**: Selecciona esta acción si el cliente quiere modificar una cita existente.
**ELIMINAR**: Selecciona esta acción si el cliente quiere cancelar o eliminar una cita existente.

### Instrucciones ###

Por favor, analiza la siguiente conversación y determina la intención del usuario.`;

export default async (_: BotContext, { state, gotoFlow, extensions }: BotMethods) => {
    const ai = extensions.ai as AIClass
    const history = getHistoryParse(state)
    const prompt = PROMPT_DISCRIMINATOR.replace('{HISTORY}', history)


    console.log(prompt)

    const { prediction } = await ai.determineChatFn([
        {
            role: 'system',
            content: prompt
        }
    ])


    console.log({ prediction });

    if (prediction.includes('HABLAR')) return gotoFlow(flowSeller);
    if (prediction.includes('PROGRAMAR')) return gotoFlow(flowSchedule);
    if (prediction.includes('MODIFICAR')) return gotoFlow(flowUpdate);
    if (prediction.includes('ELIMINAR')) return gotoFlow(flowDelete);
}