import { createFlow } from "@builderbot/bot";

import { welcomeFlow } from "./welcome.flow";
import { flowSeller } from "./seller.flow";
import { flowSchedule } from "./schedule.flow";
import { flowConfirm } from "./confirm.flow";
import { voiceFlow } from "./voice.flow";
import { registerFlow } from "./register.flow";
import { flowDeleteByDate } from "./delete.flow";
import { flowUpdate } from "./update.flow";


export default createFlow([
    welcomeFlow,
    flowSeller,
    flowSchedule,
    flowConfirm,
    voiceFlow,
    registerFlow,
    flowDeleteByDate,
    flowUpdate,
])