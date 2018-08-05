import isEqual = require("lodash.isequal");
import { CreateError } from "./utils";
import { MantleErrorTypes } from "./constants";
import { Serializable, Newable } from "./Serializable";
import { ModelFromObject, ObjectFromModel } from "./JSONAdapter";

/**
 * A function that represents a transformation.
 * 
 * Returns the result of the transformation, which may be null or undefined.
 */
export type ValueTransformerFunction = (value: any) => any;

/**
 * A value transformer supporting function-based transformation.
 */
export class ValueTransformer {
    protected forward?: ValueTransformerFunction;
    protected reverse?: ValueTransformerFunction;

    constructor(forward?: ValueTransformerFunction, reverse?: ValueTransformerFunction) {
        this.forward = forward;
        this.reverse = reverse;
    }

    /**
     * Transforms the given value.
     * 
     * @param value The value to be transformed.
     */
    transformedValue(value?: any) {
        if (this.forward) {
            return this.forward(value);
        }
        return undefined;
    }

    /**
     * Reverses the transformation of the given value.
     * 
     * @param value The value to be reversed.
     */
    reverseTransformedValue(value?: any) {
        if (this.reverse) {
            return this.reverse(value);
        }
        return undefined;
    }

    /**
     * Returns true if the transformer supports reverse transformations.
     */
    allowsReverseTransformation(): boolean {
        return this.reverse != null;
    }

    /**
     * Flips the direction of the receiver's transformation, such that `transformedValue` will
     * become `reverseTransformedValue`, and vice-versa.
     * 
     * Returns an inverted transformer.
     */
    invertedTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value) => {
                return this.reverseTransformedValue(value);
            },
            (value) => {
                return this.transformedValue(value);
            }
        )
    }

    /**
     * Returns a transformer which transforms values using the given function. Reverse transformation will not be
     * allowed.
     * 
     * @param transformation 
     */
    static forward(transformation: ValueTransformerFunction) {
        return new ValueTransformer(transformation);
    }

    /**
     * Returns a transformer which transforms values using the given function, for forward or reverse transformations.
     * 
     * @param transformation 
     */
    static reversible(transformation: ValueTransformerFunction) {
        return new ValueTransformer(transformation, transformation);
    }

    /**
     * Returns a transformer which transforms values using the given functions.
     * 
     * @param forward 
     * @param reverse 
     */
    static forwardAndReversible(forward: ValueTransformerFunction, reverse: ValueTransformerFunction) {
        return new ValueTransformer(forward, reverse);
    }

    /**
     * A reversible value transformer to transform between the keys and values of an object.
     * 
     * @param object The object whose keys and values should be transformed between.
     * @param defaultValue The result to fall back to, in case no key matching the input value was found during
     * the forward transformation.
     * @param reverseDefaultValue The result to fall back to, in case no value matching the input value was found
     * during a reverse transformation.
     */
    static valueMappingTransformer(object: { [key: string]: any }, defaultValue?: any, reverseDefaultValue?: any) {
        return ValueTransformer.forwardAndReversible(
            (key) => {
                const value = object[key];

                return value != null ? value : defaultValue;
            },
            (value) => {
                for (let key of Object.keys(object)) {
                    const reverseValue = object[key];

                    if (isEqual(value, reverseValue)) {
                        return key;
                    }
                }

                return reverseDefaultValue;
            }
        );
    }

    /**
     * A reversible value transformer to transform between a number and it's string representation.
     * 
     * Returns a transformer which will map from strings to numbers for forward transformations, and
     * from numbers to strings for reverse transformations.
     * 
     * @param locales A locale string or array of locale strings that contain one or more language or locale tags. If you include more than one locale string, list them in descending order of priority so that the first entry is the preferred locale. If you omit this parameter, the default locale of the JavaScript runtime is used.
     * @param options An object that contains one or more properties that specify comparison options.
     */
    static numberTransformer(locales?: string | string[], options?: Intl.NumberFormatOptions) {
        return ValueTransformer.forwardAndReversible(
            (value: string) => {
                if (value == null) return null;

                // make sure the value is a string
                if (typeof value !== "string") {
                    throw CreateError(`Could not convert string to number. Expected a string as input, got: ${value}.`, MantleErrorTypes.TransformerHandlingInvalidInput);
                }

                const num = parseFloat(value);

                if (isNaN(num)) {
                    return null;
                }

                return num;
            },
            (value: number) => {
                if (value == null) return null;

                // make sure the value is a number
                if (typeof value !== "number" || isNaN(value)) {
                    throw CreateError(`Could not convert number to string. Expected a number as input, got: ${value}.`, MantleErrorTypes.TransformerHandlingInvalidInput);
                }

                return value.toLocaleString(locales, options);
            }
        )
    }

    /**
     * Creates a reversible transformer to convert an object into a Model object, and vice-versa.
     * 
     * @param Class The Model subclass to attempt to parse from the JSON.
     */
    static objectTransformer<T extends Serializable>(Class: Newable<T>): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value?: any) => {
                if (value == null) return null;

                // make sure the value is an object
                if (typeof value !== "object") {
                    throw CreateError(`Could not convert JSON object to model object. Expected an object, got: ${value}.`, MantleErrorTypes.TransformerHandlingInvalidInput);
                }

                return ModelFromObject(value, Class);
            },
            (value?: Serializable) => {
                if (value == null) return null;

                return ObjectFromModel(value);
            }
        );
    }

    /**
     * Creates a reversible transformer to convert an array of objects into an array of Model
     * objects, and vice-versa.
     * 
     * @param Class The Model subclass to attempt to parse from each JSON object.
     */
    static arrayTransformer<T extends Serializable>(Class: Newable<T>): ValueTransformer {
        return ValueTransformer.forwardAndReversible((value) => {
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
                const model = ModelFromObject(object, Class);

                /* istanbul ignore next */
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
                const object = ObjectFromModel(model);

                /* istanbul ignore next */
                if (!object) continue;

                objects.push(object);
            }

            return objects;
        });
    }
}
