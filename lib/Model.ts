import get = require("lodash.get");
import set = require("lodash.set");
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
     * Initializes a model with the given object.
     *
     * @param json An object.
     */
    public static create<T extends Model>(this: Newable<T>, json: Partial<T>): T {
        const model = new this();

        if (json && typeof json === "object") {
            for (const key of Object.keys(json)) {
                const value = json[key];

                model[key] = value;
            }
        }

        return model;
    }

    /**
     * By default, this method looks for a `merge<Key>FromModel` method on the receiver,
     * and invokes it if found. If not found, and `model` is not null, the value for the
     * given key is taken from `model`.
     *
     * @param key the name of the property to merge.
     * @param model the model to merge from.
     */
    public mergeValue<T extends Model>(key: keyof T & string, model: T): void {
        // construct the method name for this key
        const methodName = `merge${key.replace(/\w/, (c) => c.toUpperCase())}FromModel`;

        // check if the object has a transformer for this property
        const method = get(this, methodName);
        const isFunction = typeof method === "function";

        // if we haven't found the merge<Key>FromModel method
        if (!method || !isFunction || method.length !== 1) {
            // and we have a model
            if (model) {
                // take the value from the given model
                set(this, key, model[key]);
            }

            return;
        }

        method.bind(this)(model);
    }

    /**
     * Merges the values of the given model into the receiver, using `mergeValue` for each
     * key in `JSONKeyPaths`.
     *
     * @param model the model to merge from.
     */
    public mergeValues<T extends Model>(model: T): void {
        if (!model) { return; }

        // get the class of the model
        const Class = model.constructor;

        // get the key paths
        const keyPaths = Class.prototype.constructor.JSONKeyPaths();

        for (const key of Object.keys(keyPaths)) {
            this.mergeValue(key as any, model);
        }
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
