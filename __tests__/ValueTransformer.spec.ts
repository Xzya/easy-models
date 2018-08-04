import { ValueTransformer } from "../lib";
import { MantleErrorTypes } from "../lib/constants";

describe("ValueTransformer", () => {
    it("should return a forward transformer with a block", () => {
        const transformer = ValueTransformer.forward((value: string) => {
            return value + "bar";
        });

        expect(transformer).toBeDefined();
        expect(transformer.allowsReverseTransformation()).toBeFalsy();

        expect(transformer.transformedValue("foo")).toEqual("foobar");
        expect(transformer.transformedValue("bar")).toEqual("barbar");
    });

    it("should return a reversible transformer with a block", () => {
        const transformer = ValueTransformer.reversible((value: string) => {
            return value + "bar";
        });

        expect(transformer).toBeDefined();
        expect(transformer.allowsReverseTransformation()).toBeTruthy();

        expect(transformer.transformedValue("foo")).toEqual("foobar");
        expect(transformer.reverseTransformedValue("foo")).toEqual("foobar");
    });

    it("should return a reversible transformer with forward and reverse blocks", () => {
        const transformer = ValueTransformer.forwardAndReversible(
            (value: string) => {
                return value + "bar";
            },
            (value: string) => {
                return value.substring(0, value.length - 3);
            }
        );

        expect(transformer).toBeDefined();
        expect(transformer.allowsReverseTransformation()).toBeTruthy();

        expect(transformer.transformedValue("foo")).toEqual("foobar");
        expect(transformer.reverseTransformedValue("foobar")).toEqual("foo");
    });

    it("should return undefined with null transformers blocks", () => {
        const transformer = ValueTransformer.forwardAndReversible(null, null);

        expect(transformer).toBeDefined();
        expect(transformer.allowsReverseTransformation()).toBeFalsy();

        expect(transformer.transformedValue("foo")).not.toBeDefined();
        expect(transformer.reverseTransformedValue("foo")).not.toBeDefined();
    });
});

describe("value mapping transformer", () => {
    enum AdditionTypes {
        Negative = -1,
        Zero = 0,
        Positive = 1,
        Default = 42,
    }

    const values = {
        "negative": AdditionTypes.Negative,
        "zero": AdditionTypes.Zero,
        "positive": AdditionTypes.Positive,
    };

    let transformer: ValueTransformer;

    beforeEach(() => {
        transformer = ValueTransformer.valueMappingTransformer(values);
    });

    it("should transform strings into enum values", () => {
        expect(transformer.transformedValue("negative")).toEqual(AdditionTypes.Negative);
        expect(transformer.transformedValue("zero")).toEqual(AdditionTypes.Zero);
        expect(transformer.transformedValue("positive")).toEqual(AdditionTypes.Positive);
    });

    it("should transform enum values into strings", () => {
        expect(transformer.allowsReverseTransformation()).toBeTruthy();

        expect(transformer.reverseTransformedValue(AdditionTypes.Negative)).toEqual("negative");
        expect(transformer.reverseTransformedValue(AdditionTypes.Zero)).toEqual("zero");
        expect(transformer.reverseTransformedValue(AdditionTypes.Positive)).toEqual("positive");
    });

    describe("default values", () => {
        beforeEach(() => {
            transformer = ValueTransformer.valueMappingTransformer(values, AdditionTypes.Default, "default")
        });

        it("should transform unknown strings into the default enum value", () => {
            expect(transformer.transformedValue("unknown")).toEqual(AdditionTypes.Default);
        });

        it("should transform the default enum value into the default string", () => {
            expect(transformer.reverseTransformedValue(AdditionTypes.Default)).toEqual("default");
        });
    });
});

describe("number transformer", () => {
    let transformer: ValueTransformer;

    beforeEach(() => {
        transformer = ValueTransformer.numberTransformer("en-US");
    });

    it("should transform strings into numbers", () => {
        expect(transformer.transformedValue("0.12345")).toEqual(0.12345);
    });

    it("should transform numbers into strings", () => {
        expect(transformer.reverseTransformedValue(12345.678)).toEqual("12,345.678");
    });

    it("should throw error on invalid transform value", () => {
        let error: Error | undefined;

        try {
            transformer.transformedValue({});
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should throw error on invalid reverse transform value", () => {
        let error: Error | undefined;

        try {
            transformer.reverseTransformedValue({});
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should return null on null input", () => {
        expect(transformer.transformedValue(null)).toEqual(null);
        expect(transformer.reverseTransformedValue(null)).toEqual(null);
    });

    it("should return null on NaN parsed input", () => {
        expect(transformer.transformedValue("foo")).toEqual(null);
    });
});

describe("invert transformer", () => {
    class TestTransformer extends ValueTransformer {
        allowsReverseTransformation() {
            return true;
        }
        transformedValue() {
            return "forward";
        }
        reverseTransformedValue() {
            return "reverse";
        }
    }

    let transformer: ValueTransformer;

    beforeEach(() => {
        transformer = new TestTransformer();
    });

    it("should invert a transformer", () => {
        const inverted = transformer.invertedTransformer();

        expect(inverted.transformedValue()).toEqual("reverse");
        expect(inverted.reverseTransformedValue()).toEqual("forward");
    });

    it("should invert an inverted transformer", () => {
        const inverted = transformer.invertedTransformer().invertedTransformer();

        expect(inverted.transformedValue()).toEqual("forward");
        expect(inverted.reverseTransformedValue()).toEqual("reverse");
    });
});
