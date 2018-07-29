import get = require("lodash.get");
import set = require("lodash.set");
import { JSONSerializable, ModelClass } from "./JSONSerializable";
import { ValueTransformer } from "./ValueTransformer";

type ValueTransformerMap = {
    [key: string]: ValueTransformer;
};

/**
 * Converts a Model object to and from JSON.
 */
export class JSONAdapter {

    /**
     * Collect all value transformers needed for a given model.
     * 
     * @param model The model from which to parse the JSON.
     */
    private static valueTransformersForModel(model: JSONSerializable) {
        let result: ValueTransformerMap = {};

        const jsonKeyPaths = model.JSONKeyPathsByPropertyKey();

        // iterate over all key paths
        for (let key of Object.keys(jsonKeyPaths)) {
            // construct the method name for this property
            const methodName = `${key}JSONTransformer`;

            // check if the object has a transformer for this property
            const method = get(model, methodName);
            const isFunction = typeof method === "function";

            // if we found the <key>JSONTransformer method
            if (method && isFunction) {
                const transformer = method() as ValueTransformer;

                if (transformer) {
                    result[key] = transformer;
                }

                continue;
            }

            // otherwise, check if the model implements JSONTransformerForKey
            if (model.JSONTransformerForKey) {
                const transformer = model.JSONTransformerForKey(key);

                if (transformer) {
                    result[key] = transformer;

                    continue;
                }
            }
        }

        return result;
    }

    /**
     * Deserializes a model from a JSON string.
     * 
     * @param jsonString A JSON string.
     * @param modelClass The model to use for JSON serialization.
     */
    static modelFromJSON<T extends JSONSerializable>(jsonString: string, modelClass: ModelClass): T | undefined {
        return JSONAdapter.modelFromObject(JSON.parse(jsonString), modelClass);
    }

    /**
     * Deserializes a model from an object.
     * 
     * @param json An object.
     * @param modelClass The model to use for JSON serialization
     */
    static modelFromObject<T extends JSONSerializable>(json: any, modelClass: ModelClass): T | undefined {
        if (json == null) return undefined;

        // if the class implements classForParsingObject
        if (modelClass.classForParsingObject) {
            const classToUse = modelClass.classForParsingObject(json);

            // if the implementation didn't return any class
            if (!classToUse) {
                return undefined;
            }

            // if the class is different than the one given as a parameter
            if (classToUse != modelClass) {
                return JSONAdapter.modelFromObject(json, classToUse);
            }
        }

        const model: T = Object.create(modelClass.prototype);

        const jsonKeyPaths = modelClass.JSONKeyPathsByPropertyKey();
        const transformers = JSONAdapter.valueTransformersForModel(modelClass);

        // iterate over all key paths
        for (let key of Object.keys(jsonKeyPaths)) {
            const keyPath = jsonKeyPaths[key];

            let value: any = {};

            // if the key path is a string
            if (typeof keyPath === "string") {
                value = get(json, keyPath);
            }
            // else it must be an array of strings
            else {
                for (let path of keyPath) {
                    set(value, path, get(json, path));
                }
            }

            const transformer = transformers[key];

            if (transformer) {
                set(model, key, transformer.transformedValue(value));

                continue;
            }

            set(model, key, value);
        }

        return model;
    }

    /**
     * Attempts to parse a JSON string into model objects of a specific class.
     * 
     * @param jsonString 
     * @param modelClass 
     */
    static modelsFromJSONArray<T extends JSONSerializable>(jsonString: string, modelClass: ModelClass): T[] | undefined {
        return JSONAdapter.modelsFromArray(JSON.parse(jsonString), modelClass);
    }

    /**
     * Attempts to parse an array of objects into model objects of a specific class.
     * 
     * @param json 
     * @param modelClass 
     */
    static modelsFromArray<T extends JSONSerializable>(json: any[], modelClass: ModelClass): T[] | undefined {
        if (json == null) return undefined;

        const models: T[] = [];

        for (let object of json) {
            const model = JSONAdapter.modelFromObject<T>(object, modelClass);

            if (!model) return undefined;

            models.push(model);
        }

        return models;
    }

    /**
     * Serializes a model into an object.
     * 
     * @param model The model to use for JSON serialization.
     */
    static objectFromModel(model: JSONSerializable): any {
        let result: any = {};

        // get the class of the model
        const modelClass = model.constructor as ModelClass;

        // get the key paths and transformers
        const jsonKeyPaths = modelClass.JSONKeyPathsByPropertyKey();
        const transformers = JSONAdapter.valueTransformersForModel(modelClass);

        for (let key of Object.keys(jsonKeyPaths)) {
            const keyPath = jsonKeyPaths[key];

            const value = get(model, key);

            const transformer = transformers[key];

            // if the key path is a string
            if (typeof keyPath === "string") {
                if (transformer) {
                    set(result, keyPath, transformer.reverseTransformedValue(value));
                }
                else {
                    set(result, keyPath, value);
                }
            }
            // else it must be an array of strings
            else {
                for (let path of keyPath) {
                    if (transformer) {
                        set(result, path, get(transformer.reverseTransformedValue(value), path));
                    } else {
                        set(result, path, get(value, path));
                    }
                }
            }
        }

        return result;
    }

    /**
     * Creates a reversible transformer to convert an object into a Model object, and vice-versa.
     * 
     * @param modelClass The Model subclass to attempt to parse from the JSON.
     */
    static dictionaryTransformerWithModelClass(modelClass: ModelClass): ValueTransformer {
        return ValueTransformer.usingForwardAndReversibleBlocks((value) => {
            if (value == null) return undefined;

            return JSONAdapter.modelFromObject(value, modelClass);
        }, (value) => {
            if (value == null) return undefined;

            return JSONAdapter.objectFromModel(value);
        });
    }

}
