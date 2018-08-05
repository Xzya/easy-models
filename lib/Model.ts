import { Serializable, Newable } from "./Serializable";
import { ModelFromObject, ModelFromJSON, ObjectFromModel, ModelsFromArray, ModelsFromJSONArray, ArrayFromModels } from "./JSONAdapter";

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

    static toJSONArray<T extends Serializable>(this: Newable<T>, models: T[]): [string | null, Error?] {
        let objects: any[] | null;
        let error: Error | undefined;

        try {
            objects = ArrayFromModels(models);

            return [JSON.stringify(objects), error];
        } catch (err) {
            error = err;
        }

        return [null, error];
    }

    toObject(): [any, Error?] {
        let object: any;
        let error: Error | undefined;

        try {
            object = ObjectFromModel(this);

            return [object, error];
        } catch (err) {
            error = err;
        }

        return [null, error];
    }

    toJSON(): [string | null, Error?] {
        const [object, error] = this.toObject();

        if (error) {
            return [null, error];
        }

        return [JSON.stringify(object), error];
    }

}
