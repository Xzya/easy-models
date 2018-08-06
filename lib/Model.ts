import { Serializable, Newable } from "./Serializable";
import { ModelFromObject, ObjectFromModel, ModelsFromArray, ArrayFromModels } from "./JSONAdapter";

export class Model extends Serializable {
    /**
     * Deserializes a model from an object.
     *
     * @param json An object.
     */
    public static from<T extends Model>(this: Newable<T>, json: any): T | null {
        return ModelFromObject<T>(json, this);
    }

    /**
     * Attempts to parse an array of objects into model objects of a specific class.
     *
     * @param json An array of objects.
     */
    public static fromArray<T extends Model>(this: Newable<T>, json: any[]): T[] | null {
        return ModelsFromArray<T>(json, this);
    }

    /**
     * Converts an array of models into an object array.
     *
     * @param models An array of models to use for JSON serialization.
     */
    public static toArray<T extends Serializable>(this: Newable<T>, models: T[]): any[] | null {
        return ArrayFromModels(models);
    }

    /**
     * Serializes a model into an object.
     */
    public toObject(): any {
        return ObjectFromModel(this);
    }

    /**
     * Serializes a model into an object.
     *
     * Note: This does not throw the error if it occurs during serialization.
     * Check `toObject` if you need that.
     */
    public toJSON(): any {
        try {
            return this.toObject();
        } catch (_) {
            // ignore this
        }

        return null;
    }

}
