import os from "node:os";
import path from "node:path";
import koffi from "koffi";



koffi.opaque('VoskModel');
koffi.opaque('VoskSpkModel');
koffi.opaque('VoskRecognizer');


type WordResult = {
    /**
     * The confidence rate in the detection. 0 For unlikely, and 1 for totally accurate.
     */
    conf: number,
    /**
     * The start of the timeframe when the word is pronounced in seconds
     */
    start: number,
    /**
     * The end of the timeframe when the word is pronounced in seconds
     */
    end: number,
    /**
     * The word detected
     */
    word: string
}

type RecognitionResults = {
    /**
     * Details about the words that have been detected
     */
    result: WordResult[],
    /**
     * The complete sentence that have been detected
     */
    text: string
}


type SpeakerResults = {
    /**
     * A floating vector representing speaker identity. It is usually about 128 numbers which uniquely represent speaker voice.
     */
    spk: number[],
    /**
     * The number of frames used to extract speaker vector. The more frames you have the more reliable is speaker vector.
     */
    spk_frames: number
}


type BaseRecognizerParam = {
    /**
     * The language model to be used 
     */
    model: Model,
    /**
     * The sample rate. Most models are trained at 16kHz
     */
    sampleRate: number,
    speakerModel?: SpeakerModel,
    grammar?:any
}


type GrammarRecognizerParam = {
    /**
     * The list of sentences to be recognized.
     */
    grammar: string[]
}

type SpeakerRecognizerParam = {
    /**
     * The SpeakerModel that will enable speaker identification
     */
    speakerModel: SpeakerModel
}


type Result<T extends SpeakerRecognizerParam | GrammarRecognizerParam> = T extends SpeakerRecognizerParam ? SpeakerResults & RecognitionResults : RecognitionResults;



type PartialResults = {
    /**
     * The partial sentence that have been detected until now
     */
    partial: string
}

/**
 * The list of strings to be recognized
 */
type Grammar = string[];


let soname;
if (os.platform() == 'win32') {
    let currentPath = process.env.Path;
    let dllDirectory = path.resolve(path.join(__dirname, "../lib", "win-x86_64"));
    process.env.Path = dllDirectory + path.delimiter + currentPath;
    soname = path.join(__dirname, "../lib", "win-x86_64", "libvosk.dll")
} else if (os.platform() == 'darwin') {
    soname = path.join(__dirname, "../lib", "osx-universal", "libvosk.dylib")
} else {
    soname = path.join(__dirname, "../lib", "linux-x86_64", "libvosk.so")
}


const lib = koffi.load(soname);

const libvosk = {
    vosk_set_log_level: lib.func("void vosk_set_log_level(int log_level)"),
    vosk_model_new: lib.func("VoskModel *vosk_model_new(const char *model_path)"),
    vosk_model_free: lib.func("void vosk_model_free(VoskModel *model)"),
    vosk_spk_model_new: lib.func("VoskSpkModel *vosk_spk_model_new(const char *model_path)"),
    vosk_spk_model_free: lib.func("void vosk_spk_model_free(VoskSpkModel *model)"),
    vosk_recognizer_new_spk: lib.func("VoskRecognizer *vosk_recognizer_new_spk(VoskModel *model, float sample_rate, VoskSpkModel *spk_model)"),
    vosk_recognizer_new: lib.func("VoskRecognizer *vosk_recognizer_new(VoskModel *model, float sample_rate)"),
    vosk_recognizer_new_grm: lib.func("VoskRecognizer *vosk_recognizer_new_grm(VoskModel *model, float sample_rate, const char *grammar)"),
    vosk_recognizer_free: lib.func("void vosk_recognizer_free(VoskRecognizer *recognizer)"),
    vosk_recognizer_set_max_alternatives: lib.func("void vosk_recognizer_set_max_alternatives(VoskRecognizer *recognizer, int max_alternatives)"),
    vosk_recognizer_set_words: lib.func("void vosk_recognizer_set_words(VoskRecognizer *recognizer, int words)"),
    vosk_recognizer_set_partial_words: lib.func("void vosk_recognizer_set_partial_words(VoskRecognizer *recognizer, int partial_words)"),
    vosk_recognizer_set_spk_model: lib.func("void vosk_recognizer_set_spk_model(VoskRecognizer *recognizer, VoskSpkModel *spk_model)"),
    vosk_recognizer_accept_waveform: lib.func("int vosk_recognizer_accept_waveform(VoskRecognizer *recognizer, const char *data, int length)"),
    vosk_recognizer_result: lib.func("const char *vosk_recognizer_result(VoskRecognizer *recognizer)"),
    vosk_recognizer_final_result: lib.func("const char *vosk_recognizer_final_result(VoskRecognizer *recognizer)"),
    vosk_recognizer_partial_result: lib.func("const char *vosk_recognizer_partial_result(VoskRecognizer *recognizer)"),
    vosk_recognizer_reset: lib.func("void vosk_recognizer_reset(VoskRecognizer *recognizer)"),
}

/**
 * Set log level for Kaldi messages
 * @param {number} level The higher, the more verbose. 0 for infos and errors. Less than 0 for silence. 
 */
export function setLogLevel(level: number) {
    libvosk.vosk_set_log_level(level);
}

/**
 * Build a Model from a model file.
 * @see models [models](https://alphacephei.com/vosk/models)
 */
export class Model {
    handle: any;
    /**
     * Build a Model to be used with the voice recognition. Each language should have it's own Model
     * for the speech recognition to work.
     * @param {string} modelPath The abstract pathname to the model
     * @see models [models](https://alphacephei.com/vosk/models)
     */
    constructor(modelPath: string) {
        /**
         * Store the handle.
         * For internal use only
         * @type {unknown}
         */
        this.handle = libvosk.vosk_model_new(modelPath);
    }

    /**
     * Releases the model memory
     *
     * The model object is reference-counted so if some recognizer
     * depends on this model, model might still stay alive. When
     * last recognizer is released, model will be released too.
     */
    free() {
        libvosk.vosk_model_free(this.handle);
    }
}

/**
 * Build a Speaker Model from a speaker model file.
 * The Speaker Model enables speaker identification.
 * @see models [models](https://alphacephei.com/vosk/models)
 */
export class SpeakerModel {
    handle: any;
    /**
     * Loads speaker model data from the file and returns the model object
     *
     * @param {string} modelPath the path of the model on the filesystem
     * @see models [models](https://alphacephei.com/vosk/models)
     */
    constructor(modelPath: string) {
        /**
         * Store the handle.
         * For internal use only
         * @type {unknown}
         */
        this.handle = libvosk.vosk_spk_model_new(modelPath);
    }

    /**
     * Releases the model memory
     *
     * The model object is reference-counted so if some recognizer
     * depends on this model, model might still stay alive. When
     * last recognizer is released, model will be released too.
     */
    free() {
        libvosk.vosk_spk_model_free(this.handle);
    }
}

/**
 * Helper to narrow down type while using `hasOwnProperty`.
 * @see hasOwnProperty [typescript issue](https://fettblog.eu/typescript-hasownproperty/)
 * @template {Object} Obj
 * @template {PropertyKey} Key
 * @param {Obj} obj 
 * @param {Key} prop 
 * @returns {obj is Obj & Record<Key, unknown>}
 */
function hasOwnProperty(obj: Object, prop: string) {
    return obj.hasOwnProperty(prop)
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
export class Recognizer {
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
    constructor(param: BaseRecognizerParam) {
        const { model, sampleRate } = param
        // Prevent the user to receive unpredictable results
        if (hasOwnProperty(param, 'speakerModel') && hasOwnProperty(param, 'grammar')) {
            throw new Error('grammar and speakerModel cannot be used together for now.')
        }
        this.handle = param.speakerModel
            ? libvosk.vosk_recognizer_new_spk(model.handle, sampleRate, param.speakerModel.handle)
            : param.grammar
                ? libvosk.vosk_recognizer_new_grm(model.handle, sampleRate, JSON.stringify(param.grammar))
                : libvosk.vosk_recognizer_new(model.handle, sampleRate);
    }

    /**
     * Releases the model memory
     *
     * The model object is reference-counted so if some recognizer
     * depends on this model, model might still stay alive. When
     * last recognizer is released, model will be released too.
     */
    free() {
        libvosk.vosk_recognizer_free(this.handle);
    }

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
    setMaxAlternatives(max_alternatives: number) {
        libvosk.vosk_recognizer_set_max_alternatives(this.handle, max_alternatives);
    }

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
    setWords(words: Boolean) {
        libvosk.vosk_recognizer_set_words(this.handle, Number(words));
    }

    /** Same as above, but for partial results*/
    setPartialWords(partial_words: Boolean) {
        libvosk.vosk_recognizer_set_partial_words(this.handle, Number(partial_words));
    }

    /** Adds speaker recognition model to already created recognizer. Helps to initialize
     * speaker recognition for grammar-based recognizer.
     *
     * @param spk_model Speaker recognition model
     */
    setSpkModel(spk_model: Model) {
        libvosk.vosk_recognizer_set_spk_model(this.handle, spk_model.handle);
    }

    /** 
     * Accept voice data
     *
     * accept and process new chunk of voice data
     *
     * @param {Buffer} data audio data in PCM 16-bit mono format
     * @returns true if silence is occured and you can retrieve a new utterance with result method
     */
    acceptWaveform(data: Buffer): Boolean {
        return !!libvosk.vosk_recognizer_accept_waveform(this.handle, data, data.length);
    };

    /** 
     * Accept voice data
     *
     * accept and process new chunk of voice data
     *
     * @param {Buffer} data audio data in PCM 16-bit mono format
     * @returns true if silence is occured and you can retrieve a new utterance with result method
     */
    acceptWaveformAsync(data: Buffer): Promise<Boolean> {
        return new Promise((resolve, reject) => {
            libvosk.vosk_recognizer_accept_waveform.async(this.handle, data, data.length, function (err: any, result: boolean) {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!result);
                }
            });
        });
    };

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
    resultString(): string {
        return libvosk.vosk_recognizer_result(this.handle);
    };

    /**
     * Returns speech recognition results
     * @returns {any} The results
     */
    result(): any {
        return JSON.parse(libvosk.vosk_recognizer_result(this.handle));
    };

    /**
     * speech recognition text which is not yet finalized.
     * result may change as recognizer process more data.
     * 
     * @returns {PartialResults} The partial results
     */
    partialResult(): PartialResults {
        return JSON.parse(libvosk.vosk_recognizer_partial_result(this.handle));
    };

    /**
     * Returns speech recognition result. Same as result, but doesn't wait for silence
     * You usually call it in the end of the stream to get final bits of audio. It
     * flushes the feature pipeline, so all remaining audio chunks got processed.
     *
     * @returns {any} speech result.
     */
    finalResult(): any {
        return JSON.parse(libvosk.vosk_recognizer_final_result(this.handle));
    };

    /**
     *
     * Resets current results so the recognition can continue from scratch 
     */
    reset() {
        libvosk.vosk_recognizer_reset(this.handle);
    }
}

