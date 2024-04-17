import { libvosk } from "./model";

/**
 * Set log level for Kaldi messages
 * @param level The higher, the more verbose. 0 for infos and errors. Less than 0 for silence.
 */
export function setLogLevel(level: number): void {
    libvosk.vosk_set_log_level(level);
}
