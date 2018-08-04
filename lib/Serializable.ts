import { ValueTransformer } from "./ValueTransformer";

export type KeyPaths<T> = {
    [K in keyof T]?: string | string[];
};

export type Newable<T> = { new(...args: any[]): T; };

/**
 * This interface defines the minimal that classes need to implement to interact with Mantle adapters.
 * 
 * It is intended for scenarios where inheriting from Model is not feasible.
 */
export interface Serializable {
    /**
     * Specifies how to map property keys to different key paths in JSON.
     * 
     * Values in the object can either be key paths in the JSON representation of the receiver or an array of such key
     * paths. If an array is used, the deserialized value will be an object containing all of the keys in the array.
     * 
     * Any keys omitted will not participate in JSON serialization.
     * 
     * Examples
     * 
     * JSONKeyPaths() {
     *     return {
     *         "name": "POI.name",
     *         "point": ["latitude", "longitude"],
     *         "starred": "starred",
     *     };
     * }
     */
    JSONKeyPaths(): { [key: string]: string | string[] };

    /**
     * Specifies how to convert a JSON value to the given property key. If reversible, the transformer will also be used
     * to convert the property value back to JSON.
     * 
     * If the receiver implements a `<key>JSONTransformer` method, JSONAdapter will use the result of that method instead.
     * 
     * Returns a value transformer, or undefined if no transformation should be performed.
     * 
     * @param key 
     */
    JSONTransformerForKey?(key: string): ValueTransformer | undefined;

    /**
     * Overridden to parse the receiver as a different class, based on information in the provided object.
     * 
     * This is mostly useful for class clusters, where the abstract base class would be passed, but a subclass should be
     * instantiated instead.
     * 
     * Returns the class that should be parsed (which may be the receiver), or undefined to abort parsing (e.g. if the data is invalid).
     * 
     * @param json 
     */
    classForParsingObject?(json: any): ModelClass;
}

export class Serializable {

}

export type ModelClass = Serializable & Newable<Serializable>;
