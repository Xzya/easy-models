import get = require("lodash.get");
import set = require("lodash.set");
import { JSONSerializable, ModelClass } from "./JSONSerializable";
import { ValueTransformer } from "./ValueTransformer";
import { CreateError } from "./utils";
import { MantleErrorTypes } from "./constants";

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
        for (const key of Object.keys(jsonKeyPaths)) {
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
     * @param Class The model to use for JSON serialization.
     */
    static modelFromJSON<T extends JSONSerializable>(jsonString: string, Class: ModelClass): T | null {
        return JSONAdapter.modelFromObject(JSON.parse(jsonString), Class);
    }

    /**
     * Deserializes a model from an object.
     * 
     * @param json An object.
     * @param Class The model to use for JSON serialization
     */
    static modelFromObject<T extends JSONSerializable>(json: any, Class: ModelClass): T | null {
        if (json == null) return null;

        // if the class implements classForParsingObject
        if (Class.classForParsingObject) {
            const classToUse = Class.classForParsingObject(json);

            // if the implementation didn't return any class
            if (!classToUse) {
                throw CreateError("No model class could be found to parse the JSON", MantleErrorTypes.JSONAdapterNoClassFound);
            }

            // if the class is different than the one given as a parameter
            if (classToUse != Class) {
                return JSONAdapter.modelFromObject(json, classToUse);
            }
        }

        const model: T = new Class.prototype.constructor();

        const jsonKeyPaths = Class.JSONKeyPathsByPropertyKey();
        const transformers = JSONAdapter.valueTransformersForModel(Class);

        // iterate over all key paths
        for (const key of Object.keys(jsonKeyPaths)) {
            const keyPath = jsonKeyPaths[key];

            let value: any = {};

            // if the key path is a string
            if (typeof keyPath === "string") {
                value = get(json, keyPath);
            }
            // else it must be an array of strings
            else {
                for (const path of keyPath) {
                    set(value, path, get(json, path));
                }
            }

            // attempt to transform the value
            const transformer = transformers[key];
            if (transformer) {
                set(model, key, transformer.transformedValue(value));

                continue;
            }

            // change undefined to null
            if (value === undefined) {
                value = null;
            }

            set(model, key, value);
        }

        return model;
    }

    /**
     * Attempts to parse a JSON string into model objects of a specific class.
     * 
     * @param jsonString 
     * @param Class 
     */
    static modelsFromJSONArray<T extends JSONSerializable>(jsonString: string, Class: ModelClass): T[] | null {
        return JSONAdapter.modelsFromArray(JSON.parse(jsonString), Class);
    }

    /**
     * Attempts to parse an array of objects into model objects of a specific class.
     * 
     * @param json 
     * @param Class 
     */
    static modelsFromArray<T extends JSONSerializable>(json: any[], Class: ModelClass): T[] | null {
        // make sure we have a value
        if (json == null) return null;

        // make sure the value is an array
        if (!Array.isArray(json)) {
            throw CreateError(`${Class} could not be created because an invalid object array was provided: ${json}.`, MantleErrorTypes.JSONAdapterInvalidJSON);
        }

        const models: T[] = [];

        for (const object of json) {
            const model = JSONAdapter.modelFromObject<T>(object, Class);

            if (!model) return null;

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
        const Class = model.constructor as ModelClass;

        // get the key paths and transformers
        const jsonKeyPaths = Class.JSONKeyPathsByPropertyKey();
        const transformers = JSONAdapter.valueTransformersForModel(Class);

        for (const key of Object.keys(jsonKeyPaths)) {
            const keyPath = jsonKeyPaths[key];

            const value = get(model, key);

            const transformer = transformers[key];

            // if the key path is a string
            if (typeof keyPath === "string") {
                if (transformer && transformer.allowsReverseTransformation()) {
                    set(result, keyPath, transformer.reverseTransformedValue(value));
                }
                else {
                    set(result, keyPath, value);
                }
            }
            // else it must be an array of strings
            else {
                for (const path of keyPath) {
                    if (transformer && transformer.allowsReverseTransformation()) {
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
     * Converts an array of models into a JSON string.
     * 
     * @param models An array of models to use for JSON serialization.
     */
    static JSONArrayFromModels<T extends JSONSerializable>(models: T[]): string | null {
        return JSON.stringify(JSONAdapter.arrayFromModels(models));
    }

    /**
     * Converts an array of models into an object array.
     * 
     * @param models An array of models to use for JSON serialization.
     */
    static arrayFromModels<T extends JSONSerializable>(models: T[]): any[] | null {
        if (models == null) return null;

        const objectArray: any[] = [];

        for (const model of models) {
            const object = JSONAdapter.objectFromModel(model);

            if (!object) return null;

            objectArray.push(object);
        }

        return objectArray;
    }

    /**
     * Creates a reversible transformer to convert an object into a Model object, and vice-versa.
     * 
     * @param Class The Model subclass to attempt to parse from the JSON.
     */
    static dictionaryTransformerWithModelClass(Class: ModelClass): ValueTransformer {
        return ValueTransformer.usingForwardAndReversibleBlocks((value) => {
            if (value == null) return null;

            // make sure the value is an object
            if (typeof value !== "object") {
                throw CreateError(`Could not convert JSON object to model object. Expected an object, got: ${value}.`, MantleErrorTypes.TransformerHandlingInvalidInput);
            }

            return JSONAdapter.modelFromObject(value, Class);
        }, (value) => {
            if (value == null) return null;

            return JSONAdapter.objectFromModel(value);
        });
    }

    /**
     * Creates a reversible transformer to convert an array of objects into an array of Model
     * objects, and vice-versa.
     * 
     * @param Class The Model subclass to attempt to parse from each JSON object.
     */
    static arrayTransformerWithModelClass(Class: ModelClass): ValueTransformer {
        return ValueTransformer.usingForwardAndReversibleBlocks((value) => {
            // make sure we have a value
            if (value == null) return null;

            // make sure the value is an array
            if (!Array.isArray(value)) {
                throw CreateError(`Could not convert JSON array to model array. Expected an array, got: ${value}.`, MantleErrorTypes.TransformerHandlingInvalidInput);
            }

            const models: any[] = [];

            for (const object of value) {
                // if the object is null, just add null
                if (object == null) {
                    models.push(null);
                    continue;
                }

                // make sure the value is an object
                if (typeof object !== "object") {
                    throw CreateError(`Could not convert JSON array to model array. Expected an object or null, got: ${object}.`, MantleErrorTypes.TransformerHandlingInvalidInput);
                }

                // convert the model
                const model = JSONAdapter.modelFromObject(object, Class);

                if (!model) continue;

                models.push(model);
            }

            return models;

        }, (value) => {
            if (value == null) return null;

            // make sure the value is an array
            if (!Array.isArray(value)) {
                throw CreateError(`Could not convert model array to JSON array. Expected an array, got: ${value}.`, MantleErrorTypes.TransformerHandlingInvalidInput);
            }

            const objects: any[] = [];

            for (const model of value) {
                // if the object is null, just add null
                if (model == null) {
                    objects.push(null);
                    continue;
                }

                // make sure the value is an object
                if (typeof model !== "object") {
                    throw CreateError(`Could not convert model array to JSON array. Expected a model or null, got: ${model}.`, MantleErrorTypes.TransformerHandlingInvalidInput);
                }

                // convert the model
                const object = JSONAdapter.objectFromModel(model);

                if (!object) continue;

                objects.push(object);
            }

            return objects;
        });
    }
}
