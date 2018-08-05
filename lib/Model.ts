import { Serializable, Newable } from "./Serializable";
import { ModelFromObject, ModelFromJSON, ObjectFromModel, ModelsFromArray, ModelsFromJSONArray, ArrayFromModels, JSONArrayFromModels } from "./JSONAdapter";

export class Model extends Serializable {
    constructor() {
        super();
    }

    /**
     * Deserializes a model from an object.
     * 
     * Returns an array, with the first element being the deserialized object, and the second
     * one being an error if any occured during the deserialization.
     * 
     * If you prefer the try catch approach, check `ModelFromObject`.
     * 
     * @param json An object.
     */
    static from<T extends Model>(this: Newable<T>, json: any): [T | null, Error?] {
        let model: T | null;
        let error: Error | undefined;

        try {
            model = ModelFromObject<T>(json, this);

            return [model, error];
        } catch (err) {
            error = err;
        }

        return [null, error];
    }

    /**
     * Deserializes a model from a JSON string.
     * 
     * Returns an array, with the first element being the deserialized object, and the second
     * one being an error if any occured during the deserialization.
     * 
     * If you prefer the try catch approach, check `ModelFromJSON`.
     * 
     * @param json A JSON string.
     */
    static fromJSON<T extends Model>(this: Newable<T>, json: string): [T | null, Error?] {
        let model: T | null;
        let error: Error | undefined;

        try {
            model = ModelFromJSON<T>(json, this);

            return [model, error];
        } catch (err) {
            error = err;
        }

        return [null, error];
    }

    /**
     * Attempts to parse an array of objects into model objects of a specific class.
     * 
     * Returns an array, with the first element being the deserialized objects, and the second
     * one being an error if any occured during the deserialization.
     * 
     * If you prefer the try catch approach, check `ModelsFromArray`.
     * 
     * @param json An array of objects.
     */
    static fromArray<T extends Model>(this: Newable<T>, json: any[]): [T[] | null, Error?] {
        let models: T[] | null;
        let error: Error | undefined;

        try {
            models = ModelsFromArray<T>(json, this);

            return [models, error];
        } catch (err) {
            error = err;
        }

        return [null, error];
    }

    /**
     * Attempts to parse a JSON string into model objects of a specific class.
     * 
     * Returns an array, with the first element being the deserialized objects, and the second
     * one being an error if any occured during the deserialization.
     * 
     * If you prefer the try catch approach, check `ModelsFromJSONArray`.
     * 
     * @param jsonString A JSON string.
     */
    static fromJSONArray<T extends Model>(this: Newable<T>, jsonString: string): [T[] | null, Error?] {
        let models: T[] | null;
        let error: Error | undefined;

        try {
            models = ModelsFromJSONArray<T>(jsonString, this);

            return [models, error];
        } catch (err) {
            error = err;
        }

        return [null, error];
    }

    /**
     * Converts an array of models into an object array.
     * 
     * Returns an array, with the first element being the serialized objects, and the second
     * one being an error if any occured during the serialization.
     * 
     * If you prefer the try catch approach, check `ArrayFromModels`.
     * 
     * @param models An array of models to use for JSON serialization.
     */
    static toArray<T extends Serializable>(this: Newable<T>, models: T[]): [any[] | null, Error?] {
        let objects: any[] | null;
        let error: Error | undefined;

        try {
            objects = ArrayFromModels(models);

            return [objects, error];
        } catch (err) {
            error = err;
        }

        return [null, error];
    }

    /**
     * Converts an array of models into a JSON string.
     * 
     * Returns an array, with the first element being the serialized objects, and the second
     * one being an error if any occured during the serialization.
     * 
     * If you prefer the try catch approach, check `JSONArrayFromModels`.
     * 
     * @param models An array of models to use for JSON serialization.
     */
    static toJSONArray<T extends Serializable>(this: Newable<T>, models: T[]): [string | null, Error?] {
        let objects: string | null;
        let error: Error | undefined;

        try {
            objects = JSONArrayFromModels(models);

            return [objects, error];
        } catch (err) {
            error = err;
        }

        return [null, error];
    }

    /**
     * Serializes a model into an object.
     * 
     * Returns an array, with the first element being the serialized object, and the second
     * one being an error if any occured during the serialization.
     * 
     * If you prefer the try catch approach, check `ObjectFromModel`.
     */
    toObject(): [any, Error?] {
        let object: any;
        let error: Error | undefined;

        try {
            object = ObjectFromModel(this);

            return [object];
        } catch (err) {
            error = err;
        }

        return [null, error];
    }

    /**
     * Serializes a model into an object.
     * 
     * Note: This does not throw the error if it occurs during serialization.
     * Check `toObject` if you need that.
     */
    toJSON(): any {
        const [object] = this.toObject();

        return object;
    }

}
