import get = require("lodash.get");
import set = require("lodash.set");
import { Serializable, Newable } from "./Serializable";
import { ValueTransformer } from "./ValueTransformer";
import { CreateError } from "./utils";
import { MantleErrorTypes } from "./constants";

type ValueTransformerMap = {
    [key: string]: ValueTransformer;
};

/**
 * Collect all value transformers needed for a given model.
 * 
 * @param Class The class from which to parse the JSON.
 */
function valueTransformersForModel<T extends Serializable>(Class: Newable<T>) {
    let result: ValueTransformerMap = {};

    const jsonKeyPaths = Class.prototype.constructor.JSONKeyPaths();

    // iterate over all key paths
    for (const key of Object.keys(jsonKeyPaths)) {
        // construct the method name for this property
        const methodName = `${key}JSONTransformer`;

        // check if the object has a transformer for this property
        const method = get(Class, methodName);
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
        if (Class.prototype.constructor.JSONTransformerForKey) {
            const transformer = Class.prototype.constructor.JSONTransformerForKey(key);

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
export function ModelFromJSON<T extends Serializable>(jsonString: string, Class: Newable<T>): T | null {
    return ModelFromObject(JSON.parse(jsonString), Class);
}

/**
 * Deserializes a model from an object.
 * 
 * @param json An object.
 * @param Class The model to use for JSON serialization
 */
export function ModelFromObject<T extends Serializable>(json: any, Class: Newable<T>): T | null {
    if (json == null) return null;

    // if the class implements classForParsingObject
    if (Class.prototype.constructor.classForParsingObject && typeof Class.prototype.constructor.classForParsingObject === "function") {
        const classToUse = Class.prototype.constructor.classForParsingObject(json);

        // if the implementation didn't return any class
        if (!classToUse) {
            throw CreateError("No model class could be found to parse the JSON", MantleErrorTypes.JSONAdapterNoClassFound);
        }

        // if the class is different than the one given as a parameter
        if (classToUse != Class) {
            return ModelFromObject(json, classToUse);
        }
    }

    const model: T = new Class.prototype.constructor();

    const jsonKeyPaths = Class.prototype.constructor.JSONKeyPaths();
    const transformers = valueTransformersForModel(Class);

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
 * @param jsonString A JSON string.
 * @param Class The model to use for JSON serialization.
 */
export function ModelsFromJSONArray<T extends Serializable>(jsonString: string, Class: Newable<T>): T[] | null {
    return ModelsFromArray(JSON.parse(jsonString), Class);
}

/**
 * Attempts to parse an array of objects into model objects of a specific class.
 * 
 * @param json An array of objects.
 * @param Class The model to use for JSON serialization.
 */
export function ModelsFromArray<T extends Serializable>(json: any[], Class: Newable<T>): T[] | null {
    // make sure we have a value
    if (json == null) return null;

    // make sure the value is an array
    if (!Array.isArray(json)) {
        throw CreateError(`${Class} could not be created because an invalid object array was provided: ${json}.`, MantleErrorTypes.JSONAdapterInvalidJSON);
    }

    const models: T[] = [];

    for (const object of json) {
        const model = ModelFromObject<T>(object, Class);

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
export function ObjectFromModel<T extends Serializable>(model: T): any {
    let result: any = {};

    // get the class of the model
    const Class = model.constructor as Newable<T>;

    // get the key paths and transformers
    const jsonKeyPaths = Class.prototype.constructor.JSONKeyPaths();
    const transformers = valueTransformersForModel(Class);

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
 * Converts an array of models into an object array.
 * 
 * @param models An array of models to use for JSON serialization.
 */
export function ArrayFromModels<T extends Serializable>(models: T[]): any[] | null {
    // make sure we have a value
    if (models == null) return null;

    // make sure the value is an array
    if (!Array.isArray(models)) {
        throw CreateError(`Could not create object array because an invalid model array was provided: ${models}.`, MantleErrorTypes.JSONAdapterInvalidJSON);
    }

    const objectArray: any[] = [];

    for (const model of models) {
        const object = ObjectFromModel(model);

        /* istanbul ignore next */
        if (!object) return null;

        objectArray.push(object);
    }

    return objectArray;
}
