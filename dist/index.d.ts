type BaseRecognizerParam = {
    /**
     * The language model to be used
     */
    model: Model;
    /**
     * The sample rate. Most models are trained at 16kHz
     */
    sampleRate: number;
    speakerModel?: SpeakerModel;
    grammar?: any;
};
type PartialResults = {
    /**
     * The partial sentence that have been detected until now
     */
    partial: string;
};
/**
 * Set log level for Kaldi messages
 * @param {number} level The higher, the more verbose. 0 for infos and errors. Less than 0 for silence.
 */
declare function setLogLevel(level: number): void;
/**
 * Build a Model from a model file.
 * @see models [models](https://alphacephei.com/vosk/models)
 */
declare class Model {
    handle: any;
    /**
     * Build a Model to be used with the voice recognition. Each language should have it's own Model
     * for the speech recognition to work.
     * @param {string} modelPath The abstract pathname to the model
     * @see models [models](https://alphacephei.com/vosk/models)
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
 * @see models [models](https://alphacephei.com/vosk/models)
 */
declare class SpeakerModel {
    handle: any;
    /**
     * Loads speaker model data from the file and returns the model object
     *
     * @param {string} modelPath the path of the model on the filesystem
     * @see models [models](https://alphacephei.com/vosk/models)
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
 * @template T
 * @template U
 * @typedef {{ [P in Exclude<keyof T, keyof U>]?: never }} Without
 */
/**
 * @template T
 * @template U
 * @typedef {(T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U} XOR
 */
/**
 * Create a Recognizer that will be able to transform audio streams into text using a Model.
 * @template {XOR<SpeakerRecognizerParam, Partial<GrammarRecognizerParam>>} T extra parameter
 * @see Model
 */
declare class Recognizer {
    handle: unknown;
    /**
     * Create a Recognizer that will handle speech to text recognition.
     * @constructor
     * @param {T & BaseRecognizerParam} param The Recognizer parameters
     *
     *  Sometimes when you want to improve recognition accuracy and when you don't need
     *  to recognize large vocabulary you can specify a list of phrases to recognize. This
     *  will improve recognizer speed and accuracy but might return [unk] if user said
     *  something different.
     *
     *  Only recognizers with lookahead models support this type of quick configuration.
     *  Precompiled HCLG graph models are not supported.
     */
    constructor(param: BaseRecognizerParam);
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
     * <pre>
     *   {
     *      "alternatives": [
     *          { "text": "one two three four five", "confidence": 0.97 },
     *          { "text": "one two three for five", "confidence": 0.03 },
     *      ]
     *   }
     * </pre>
     *
     * @param max_alternatives - maximum alternatives to return from recognition results
     */
    setMaxAlternatives(max_alternatives: number): void;
    /** Configures recognizer to output words with times
     *
     * <pre>
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
     * </pre>
     *
     * @param words - boolean value
     */
    setWords(words: Boolean): void;
    /** Same as above, but for partial results*/
    setPartialWords(partial_words: Boolean): void;
    /** Adds speaker recognition model to already created recognizer. Helps to initialize
     * speaker recognition for grammar-based recognizer.
     *
     * @param spk_model Speaker recognition model
     */
    setSpkModel(spk_model: Model): void;
    /**
     * Accept voice data
     *
     * accept and process new chunk of voice data
     *
     * @param {Buffer} data audio data in PCM 16-bit mono format
     * @returns true if silence is occured and you can retrieve a new utterance with result method
     */
    acceptWaveform(data: Buffer): Boolean;
    /**
     * Accept voice data
     *
     * accept and process new chunk of voice data
     *
     * @param {Buffer} data audio data in PCM 16-bit mono format
     * @returns true if silence is occured and you can retrieve a new utterance with result method
     */
    acceptWaveformAsync(data: Buffer): Promise<Boolean>;
    /** Returns speech recognition result in a string
     *
     * @returns the result in JSON format which contains decoded line, decoded
     *          words, times in seconds and confidences. You can parse this result
     *          with any json parser
     * <pre>
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
     * </pre>
     */
    resultString(): string;
    /**
     * Returns speech recognition results
     * @returns {any} The results
     */
    result(): any;
    /**
     * speech recognition text which is not yet finalized.
     * result may change as recognizer process more data.
     *
     * @returns {PartialResults} The partial results
     */
    partialResult(): PartialResults;
    /**
     * Returns speech recognition result. Same as result, but doesn't wait for silence
     * You usually call it in the end of the stream to get final bits of audio. It
     * flushes the feature pipeline, so all remaining audio chunks got processed.
     *
     * @returns {any} speech result.
     */
    finalResult(): any;
    /**
     *
     * Resets current results so the recognition can continue from scratch
     */
    reset(): void;
}
declare const _default: {
    setLogLevel: typeof setLogLevel;
    Model: typeof Model;
    SpeakerModel: typeof SpeakerModel;
    Recognizer: typeof Recognizer;
};

export { Model, Recognizer, SpeakerModel, _default as default, setLogLevel };
