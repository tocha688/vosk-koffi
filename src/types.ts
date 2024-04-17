import type { Model, SpeakerModel } from "./model";

/** The list of strings to be recognized */
export type Grammar = string[];

export interface WordResult {
    /** The confidence rate in the detection. 0 For unlikely, and 1 for totally accurate. */
    conf?: number;
    /** The start of the timeframe when the word is pronounced in seconds */
    start: number;
    /** The end of the timeframe when the word is pronounced in seconds */
    end: number;
    /** The word detected */
    word: string;
}

export interface RecognitionResults {
    confidence: number;
    /** Details about the words that have been detected */
    result: WordResult[];
    /** The complete sentence that have been detected */
    text: string;
}

export interface SpeakerResults {
    /** A floating vector representing speaker identity. It is usually about 128 numbers which uniquely represent speaker voice */
    spk: number[];
    /** The number of frames used to extract speaker vector. The more frames you have the more reliable is speaker vector */
    spk_frames: number;
}

export interface BaseRecognizerParam {
    /** The language model to be used */
    model: Model;
    /** The sample rate. Most models are trained at 16kHz */
    sampleRate: number;
}

export interface GrammarRecognizerParam {
    /** The list of sentences to be recognized */
    grammar: string[];
}

export interface SpeakerRecognizerParam {
    /** The SpeakerModel that will enable speaker identification */
    speakerModel: SpeakerModel;
}

export interface PartialResults {
    /** The partial sentence that have been detected until now */
    partial: string;
}

export type Result<T> = T extends SpeakerRecognizerParam
    ? SpeakerResults & RecognitionResults
    : RecognitionResults;
