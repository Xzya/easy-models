import isEqual = require("lodash.isequal");

type AnyMap = {
    [key: string]: any;
};

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

    private constructor(forward?: ValueTransformerFunction, reverse?: ValueTransformerFunction) {
        this.forward = forward;
        this.reverse = reverse;
    }

    /**
     * Transforms the given value.
     * 
     * @param value The value to be transformed.
     */
    transformedValue(value: any) {
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
    reverseTransformedValue(value: any) {
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
     * Returns a transformer which transforms values using the given function. Reverse transformation will not be
     * allowed.
     * 
     * @param transformation 
     */
    static usingForwardBlock(transformation: ValueTransformerFunction) {
        return new ValueTransformer(transformation);
    }

    /**
     * Returns a transformer which transforms values using the given function, for forward or reverse transformations.
     * 
     * @param transformation 
     */
    static usingReversibleBlock(transformation: ValueTransformerFunction) {
        return new ValueTransformer(transformation, transformation);
    }

    /**
     * Returns a transformer which transforms values using the given functions.
     * 
     * @param forward 
     * @param reverse 
     */
    static usingForwardAndReversibleBlocks(forward: ValueTransformerFunction, reverse: ValueTransformerFunction) {
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
    static valueMappingTransformer(object: AnyMap, defaultValue?: any, reverseDefaultValue?: any) {
        return ValueTransformer.usingForwardAndReversibleBlocks(
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

}
