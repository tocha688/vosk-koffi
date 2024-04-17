import * as koffi from 'koffi';
import koffi__default from 'koffi';

declare const libvosk: {
    vosk_set_log_level: koffi__default.KoffiFunction;
    vosk_model_new: koffi__default.KoffiFunction;
    vosk_model_free: koffi__default.KoffiFunction;
    vosk_spk_model_new: koffi__default.KoffiFunction;
    vosk_spk_model_free: koffi__default.KoffiFunction;
    vosk_recognizer_new_spk: koffi__default.KoffiFunction;
    vosk_recognizer_new: koffi__default.KoffiFunction;
    vosk_recognizer_new_grm: koffi__default.KoffiFunction;
    vosk_recognizer_free: koffi__default.KoffiFunction;
    vosk_recognizer_set_max_alternatives: koffi__default.KoffiFunction;
    vosk_recognizer_set_words: koffi__default.KoffiFunction;
    vosk_recognizer_set_partial_words: koffi__default.KoffiFunction;
    vosk_recognizer_set_spk_model: koffi__default.KoffiFunction;
    vosk_recognizer_accept_waveform: koffi__default.KoffiFunction;
    vosk_recognizer_result: koffi__default.KoffiFunction;
    vosk_recognizer_final_result: koffi__default.KoffiFunction;
    vosk_recognizer_partial_result: koffi__default.KoffiFunction;
    vosk_recognizer_reset: koffi__default.KoffiFunction;
};
/**
 * Build a Model from a model directory.
 * @see [available models](https://alphacephei.com/vosk/models)
 */
declare class Model {
    /** Store the handle. For internal use only */
    handle: any;
    /**
     * Build a Model to be used with the voice recognition. Each language should have it's own Model
     * for the speech recognition to work.
     * @param modelPath The abstract pathname to the model
     * @see [available models](https://alphacephei.com/vosk/models)
     */
    constructor(modelPath: string);
    /**
     * Releases the model memory
     *
     * The model object is reference-counted so if some recognizer
     * depends on this model, model might still stay alive. When
     * last recognizer is released, model will be released too.
     */
    free(): void;
}
/**
 * Build a Speaker Model from a speaker model file.
 * The Speaker Model enables speaker identification.
 * @see [available models](https://alphacephei.com/vosk/models)
 */
declare class SpeakerModel {
    /** Store the handle. For internal use only */
    handle: any;
    /**
     * Loads speaker model data from the file and returns the model object
     *
     * @param modelPath the path of the model on the filesystem
     * @see [available models](https://alphacephei.com/vosk/models)
     */
    constructor(modelPath: string);
    /**
     * Releases the model memory
     *
     * The model object is reference-counted so if some recognizer
     * depends on this model, model might still stay alive. When
     * last recognizer is released, model will be released too.
     */
    free(): void;
}

/** The list of strings to be recognized */
type Grammar = string[];
interface WordResult {
    /** The confidence rate in the detection. 0 For unlikely, and 1 for totally accurate. */
    conf?: number;
    /** The start of the timeframe when the word is pronounced in seconds */
    start: number;
    /** The end of the timeframe when the word is pronounced in seconds */
    end: number;
    /** The word detected */
    word: string;
}
interface RecognitionResults {
    confidence: number;
    /** Details about the words that have been detected */
    result: WordResult[];
    /** The complete sentence that have been detected */
    text: string;
}
interface SpeakerResults {
    /** A floating vector representing speaker identity. It is usually about 128 numbers which uniquely represent speaker voice */
    spk: number[];
    /** The number of frames used to extract speaker vector. The more frames you have the more reliable is speaker vector */
    spk_frames: number;
}
interface BaseRecognizerParam {
    /** The language model to be used */
    model: Model;
    /** The sample rate. Most models are trained at 16kHz */
    sampleRate: number;
}
interface GrammarRecognizerParam {
    /** The list of sentences to be recognized */
    grammar: string[];
}
interface SpeakerRecognizerParam {
    /** The SpeakerModel that will enable speaker identification */
    speakerModel: SpeakerModel;
}
interface PartialResults {
    /** The partial sentence that have been detected until now */
    partial: string;
}
type Result<T> = T extends SpeakerRecognizerParam ? SpeakerResults & RecognitionResults : RecognitionResults;

type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
/**
 * Create a Recognizer that will be able to transform audio streams into text using a Model.
 * @see Model
 */
declare class Recognizer<T extends XOR<SpeakerRecognizerParam, Partial<GrammarRecognizerParam>>> {
    /** Store the handle. For internal use only */
    private handle;
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
    constructor(param: T & BaseRecognizerParam);
    /**
     * Releases the model memory
     *
     * The model object is reference-counted so if some recognizer
     * depends on this model, model might still stay alive. When
     * last recognizer is released, model will be released too.
     */
    free(): void;
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
    setMaxAlternatives(max_alternatives: number): this;
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
    setWords(words: boolean): this;
    /** Same as above, but for partial results */
    setPartialWords(partial_words: boolean): this;
    /** Adds speaker recognition model to already created recognizer. Helps to initialize
     * speaker recognition for grammar-based recognizer.
     *
     * @param spk_model Speaker recognition model
     */
    setSpkModel(spk_model: SpeakerModel): this;
    /**
     * Accept voice data
     *
     * accept and process new chunk of voice data
     *
     * @param data audio data in PCM 16-bit mono format
     * @returns true if silence is occured and you can retrieve a new utterance with result method
     */
    acceptWaveform(data: Buffer): boolean;
    /**
     * Accept voice data
     *
     * accept and process new chunk of voice data
     *
     * @param data audio data in PCM 16-bit mono format
     * @returns true if silence is occured and you can retrieve a new utterance with result method
     */
    acceptWaveformAsync(data: Buffer): Promise<boolean>;
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
    resultString(): string | null;
    /**
     * Returns speech recognition results
     * @returns The results
     */
    result(): {
        alternatives: Result<T>[];
    };
    /**
     * speech recognition text which is not yet finalized.
     * result may change as recognizer process more data.
     *
     * @returns The partial results
     */
    partialResult(): PartialResults;
    /**
     * Returns speech recognition result. Same as result, but doesn't wait for silence
     * You usually call it in the end of the stream to get final bits of audio. It
     * flushes the feature pipeline, so all remaining audio chunks got processed.
     *
     * @returns speech result.
     */
    finalResult(): {
        alternatives: Result<T>[];
    };
    /**
     * Resets current results so the recognition can continue from scratch
     */
    reset(): this;
}

/**
 * Set log level for Kaldi messages
 * @param level The higher, the more verbose. 0 for infos and errors. Less than 0 for silence.
 */
declare function setLogLevel(level: number): void;

declare const _default: {
    Recognizer: typeof Recognizer;
    setLogLevel(level: number): void;
    libvosk: {
        vosk_set_log_level: koffi.KoffiFunction;
        vosk_model_new: koffi.KoffiFunction;
        vosk_model_free: koffi.KoffiFunction;
        vosk_spk_model_new: koffi.KoffiFunction;
        vosk_spk_model_free: koffi.KoffiFunction;
        vosk_recognizer_new_spk: koffi.KoffiFunction;
        vosk_recognizer_new: koffi.KoffiFunction;
        vosk_recognizer_new_grm: koffi.KoffiFunction;
        vosk_recognizer_free: koffi.KoffiFunction;
        vosk_recognizer_set_max_alternatives: koffi.KoffiFunction;
        vosk_recognizer_set_words: koffi.KoffiFunction;
        vosk_recognizer_set_partial_words: koffi.KoffiFunction;
        vosk_recognizer_set_spk_model: koffi.KoffiFunction;
        vosk_recognizer_accept_waveform: koffi.KoffiFunction;
        vosk_recognizer_result: koffi.KoffiFunction;
        vosk_recognizer_final_result: koffi.KoffiFunction;
        vosk_recognizer_partial_result: koffi.KoffiFunction;
        vosk_recognizer_reset: koffi.KoffiFunction;
    };
    Model: typeof Model;
    SpeakerModel: typeof SpeakerModel;
};

export { BaseRecognizerParam, Grammar, GrammarRecognizerParam, Model, PartialResults, RecognitionResults, Recognizer, Result, SpeakerModel, SpeakerRecognizerParam, SpeakerResults, Without, WordResult, XOR, _default as default, libvosk, setLogLevel };
