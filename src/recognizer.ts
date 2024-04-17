import {
    BaseRecognizerParam,
    GrammarRecognizerParam,
    SpeakerRecognizerParam,
    PartialResults,
    Result,
} from "./types";
import { libvosk, SpeakerModel } from "./model";

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

/**
 * Create a Recognizer that will be able to transform audio streams into text using a Model.
 * @see Model
 */
export class Recognizer<T extends XOR<SpeakerRecognizerParam, Partial<GrammarRecognizerParam>>> {
    /** Store the handle. For internal use only */
    private handle: any;

    /**
     * Create a Recognizer that will handle speech to text recognition.
     *
     * Sometimes when you want to improve recognition accuracy and when you don't need
     * to recognize large vocabulary you can specify a list of phrases to recognize. This
     * will improve recognizer speed and accuracy but might return [unk] if user said
     * something different.
     *
     * Only recognizers with lookahead models support this type of quick configuration.
     * Precompiled HCLG graph models are not supported.
     *
     * @param param The Recognizer parameters
     */
    constructor(param: T & BaseRecognizerParam) {
        const { model, sampleRate } = param;
        // Prevent the user to receive unpredictable results
        if (param["speakerModel"] && param["grammar"]) {
            throw new Error("grammar and speakerModel cannot be used together for now.");
        }

        this.handle = param["speakerModel"]
            ? libvosk.vosk_recognizer_new_spk(model.handle, sampleRate, param.speakerModel.handle)
            : param["grammar"]
            ? libvosk.vosk_recognizer_new_grm(
                  model.handle,
                  sampleRate,
                  JSON.stringify(param.grammar),
              )
            : libvosk.vosk_recognizer_new(model.handle, sampleRate);
    }

    /**
     * Releases the model memory
     *
     * The model object is reference-counted so if some recognizer
     * depends on this model, model might still stay alive. When
     * last recognizer is released, model will be released too.
     */
    public free(): void {
        libvosk.vosk_recognizer_free(this.handle);
    }

    /** Configures recognizer to output n-best results
     *
     * ```
     *   {
     *      "alternatives": [
     *          { "text": "one two three four five", "confidence": 0.97 },
     *          { "text": "one two three for five", "confidence": 0.03 },
     *      ]
     *   }
     * ```
     *
     * @param max_alternatives - maximum alternatives to return from recognition results
     */
    public setMaxAlternatives(max_alternatives: number): this {
        libvosk.vosk_recognizer_set_max_alternatives(this.handle, max_alternatives);
        return this;
    }

    /** Configures recognizer to output words with times
     *
     * ```
     *   "result" : [{
     *       "conf" : 1.000000,
     *       "end" : 1.110000,
     *       "start" : 0.870000,
     *       "word" : "what"
     *     }, {
     *       "conf" : 1.000000,
     *       "end" : 1.530000,
     *       "start" : 1.110000,
     *       "word" : "zero"
     *     }, {
     *       "conf" : 1.000000,
     *       "end" : 1.950000,
     *       "start" : 1.530000,
     *       "word" : "zero"
     *     }, {
     *       "conf" : 1.000000,
     *       "end" : 2.340000,
     *       "start" : 1.950000,
     *       "word" : "zero"
     *     }, {
     *       "conf" : 1.000000,
     *       "end" : 2.610000,
     *       "start" : 2.340000,
     *       "word" : "one"
     *     }],
     * ```
     *
     * @param words - boolean value
     */
    public setWords(words: boolean): this {
        libvosk.vosk_recognizer_set_words(this.handle, words);
        return this;
    }

    /** Same as above, but for partial results */
    public setPartialWords(partial_words: boolean): this {
        libvosk.vosk_recognizer_set_partial_words(this.handle, partial_words);
        return this;
    }

    /** Adds speaker recognition model to already created recognizer. Helps to initialize
     * speaker recognition for grammar-based recognizer.
     *
     * @param spk_model Speaker recognition model
     */
    public setSpkModel(spk_model: SpeakerModel): this {
        libvosk.vosk_recognizer_set_spk_model(this.handle, spk_model.handle);
        return this;
    }

    /**
     * Accept voice data
     *
     * accept and process new chunk of voice data
     *
     * @param data audio data in PCM 16-bit mono format
     * @returns true if silence is occured and you can retrieve a new utterance with result method
     */
    public acceptWaveform(data: Buffer): boolean {
        return libvosk.vosk_recognizer_accept_waveform(
            this.handle,
            data as any,
            data.length,
        );
    }

    /**
     * Accept voice data
     *
     * accept and process new chunk of voice data
     *
     * @param data audio data in PCM 16-bit mono format
     * @returns true if silence is occured and you can retrieve a new utterance with result method
     */
    public acceptWaveformAsync(data: Buffer): Promise<boolean> {
        return new Promise((resolve, reject) => {
            libvosk.vosk_recognizer_accept_waveform.async(
                this.handle,
                data as any,
                data.length,
                function (err:Error, result:boolean) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                },
            );
        });
    }

    /** Returns speech recognition result in a string
     *
     * ```
     * {
     *   "result" : [{
     *       "conf" : 1.000000,
     *       "end" : 1.110000,
     *       "start" : 0.870000,
     *       "word" : "what"
     *     }, {
     *       "conf" : 1.000000,
     *       "end" : 1.530000,
     *       "start" : 1.110000,
     *       "word" : "zero"
     *     }, {
     *       "conf" : 1.000000,
     *       "end" : 1.950000,
     *       "start" : 1.530000,
     *       "word" : "zero"
     *     }, {
     *       "conf" : 1.000000,
     *       "end" : 2.340000,
     *       "start" : 1.950000,
     *       "word" : "zero"
     *     }, {
     *       "conf" : 1.000000,
     *      "end" : 2.610000,
     *       "start" : 2.340000,
     *       "word" : "one"
     *     }],
     *   "text" : "what zero zero zero one"
     *  }
     * ```
     *
     * @returns the result in JSON format which contains decoded line, decoded
     *          words, times in seconds and confidences. You can parse this result
     *          with any json parser
     */
    public resultString(): string | null {
        return libvosk.vosk_recognizer_result(this.handle);
    }

    /**
     * Returns speech recognition results
     * @returns The results
     */
    public result(): { alternatives: Result<T>[] } {
        return JSON.parse(libvosk.vosk_recognizer_result(this.handle) || "null");
    }

    /**
     * speech recognition text which is not yet finalized.
     * result may change as recognizer process more data.
     *
     * @returns The partial results
     */
    public partialResult(): PartialResults {
        return JSON.parse(libvosk.vosk_recognizer_partial_result(this.handle) || "null");
    }

    /**
     * Returns speech recognition result. Same as result, but doesn't wait for silence
     * You usually call it in the end of the stream to get final bits of audio. It
     * flushes the feature pipeline, so all remaining audio chunks got processed.
     *
     * @returns speech result.
     */
    public finalResult(): { alternatives: Result<T>[] } {
        return JSON.parse(libvosk.vosk_recognizer_final_result(this.handle) || "null");
    }

    /**
     * Resets current results so the recognition can continue from scratch
     */
    public reset(): this {
        libvosk.vosk_recognizer_reset(this.handle);
        return this;
    }
}
