import path from "node:path";
import koffi from "koffi";

koffi.opaque('VoskModel');
koffi.opaque('VoskSpkModel');
koffi.opaque('VoskRecognizer');

function get_lib(): string {
    const dir = path.resolve(__dirname, "..", `bin-${process.platform}-${process.arch}`);
    if (process.platform == "win32") {
        // Update path to load dependent dlls
        process.env.Path = dir + path.delimiter + process.env.Path;

        return path.join(dir, "libvosk.dll");
    } else if (process.platform == "darwin") {
        return path.join(dir, "libvosk.dylib");
    } else {
        return path.join(dir, "libvosk.so");
    }
}

const lib = koffi.load(get_lib());

export const libvosk = {
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
 * Build a Model from a model directory.
 * @see [available models](https://alphacephei.com/vosk/models)
 */
export class Model {
    /** Store the handle. For internal use only */
    public handle: any;

    /**
     * Build a Model to be used with the voice recognition. Each language should have it's own Model
     * for the speech recognition to work.
     * @param modelPath The abstract pathname to the model
     * @see [available models](https://alphacephei.com/vosk/models)
     */
    constructor(modelPath: string) {
        this.handle = libvosk.vosk_model_new(modelPath);
    }

    /**
     * Releases the model memory
     *
     * The model object is reference-counted so if some recognizer
     * depends on this model, model might still stay alive. When
     * last recognizer is released, model will be released too.
     */
    public free(): void {
        libvosk.vosk_model_free(this.handle);
    }
}

/**
 * Build a Speaker Model from a speaker model file.
 * The Speaker Model enables speaker identification.
 * @see [available models](https://alphacephei.com/vosk/models)
 */
export class SpeakerModel {
    /** Store the handle. For internal use only */
    public handle: any;
    /**
     * Loads speaker model data from the file and returns the model object
     *
     * @param modelPath the path of the model on the filesystem
     * @see [available models](https://alphacephei.com/vosk/models)
     */
    constructor(modelPath: string) {
        this.handle = libvosk.vosk_spk_model_new(modelPath);
    }

    /**
     * Releases the model memory
     *
     * The model object is reference-counted so if some recognizer
     * depends on this model, model might still stay alive. When
     * last recognizer is released, model will be released too.
     */
    public free(): void {
        libvosk.vosk_spk_model_free(this.handle);
    }
}
