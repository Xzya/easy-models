import { Serializable, Newable } from "./Serializable";
import { ModelFromObject, ModelFromJSON, ObjectFromModel, ModelsFromArray, ModelsFromJSONArray, ArrayFromModels } from "./JSONAdapter";

export class Model extends Serializable {
    constructor() {
        super();
    }

    /**
     * Deserializes a model from an object.
     * 
     * @param json An object.
     */
    static from<T extends Model>(this: Newable<T>, json: any): T | null {
        return ModelFromObject<T>(json, this);
    }

    /**
     * Deserializes a model from a JSON string.
     * 
     * @param json A JSON string.
     */
    static fromJSON<T extends Model>(this: Newable<T>, json: string): T | null {
        return ModelFromJSON<T>(json, this);
    }

    /**
     * Attempts to parse an array of objects into model objects of a specific class.
     * 
     * @param json An array of objects.
     */
    static fromArray<T extends Model>(this: Newable<T>, json: any[]): T[] | null {
        return ModelsFromArray<T>(json, this);
    }

    /**
     * Attempts to parse a JSON string into model objects of a specific class.
     * 
     * @param jsonString A JSON string.
     */
    static fromJSONArray<T extends Model>(this: Newable<T>, jsonString: string): T[] | null {
        return ModelsFromJSONArray<T>(jsonString, this);
    }

    /**
     * Converts an array of models into an object array.
     * 
     * @param models An array of models to use for JSON serialization.
     */
    static toArray<T extends Serializable>(this: Newable<T>, models: T[]): any[] | null {
        return ArrayFromModels(models);
    }

    /**
     * Serializes a model into an object.
     */
    toObject(): [any, Error?] {
        return ObjectFromModel(this);
    }

    /**
     * Serializes a model into an object.
     * 
     * Note: This does not throw the error if it occurs during serialization.
     * Check `toObject` if you need that.
     */
    toJSON(): any {
        try {
            return this.toObject();
        } catch (_) { }
        return null;
    }

}
