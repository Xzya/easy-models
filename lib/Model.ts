import { Serializable, Newable } from "./Serializable";
import { ModelFromObject, ModelFromJSON, ObjectFromModel, ModelsFromArray, ModelsFromJSONArray } from "./JSONAdapter";

export class Model extends Serializable {
    constructor() {
        super();
    }

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

    toObject() {
        return ObjectFromModel(this);
    }

    toJSON() {
        return JSON.stringify(this.toObject());
    }

}
