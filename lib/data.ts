import raw from "./hr_data.json";
import type { HrData } from "./types";

export const hrData = raw as unknown as HrData;
