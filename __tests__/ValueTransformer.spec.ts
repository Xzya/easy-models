import { ValueTransformer } from "../lib";

describe("ValueTransformer", () => {
    it("should return a forward transformer with a block", () => {
        const transformer = ValueTransformer.usingForwardBlock((value: string) => {
            return value + "bar";
        });

        expect(transformer).toBeDefined();
        expect(transformer.allowsReverseTransformation()).toBeFalsy();

        expect(transformer.transformedValue("foo")).toEqual("foobar");
        expect(transformer.transformedValue("bar")).toEqual("barbar");
    });

    it("should return a reversible transformer with a block", () => {
        const transformer = ValueTransformer.usingReversibleBlock((value: string) => {
            return value + "bar";
        });

        expect(transformer).toBeDefined();
        expect(transformer.allowsReverseTransformation()).toBeTruthy();

        expect(transformer.transformedValue("foo")).toEqual("foobar");
        expect(transformer.reverseTransformedValue("foo")).toEqual("foobar");
    });

    it("should return a reversible transformer with forward and reverse blocks", () => {
        const transformer = ValueTransformer.usingForwardAndReversibleBlocks(
            (value: string) => {
                return value + "bar";
            },
            (value: string) => {
                return value.substring(0, value.length - 3);
            }
        )

        expect(transformer).toBeDefined();
        expect(transformer.allowsReverseTransformation()).toBeTruthy();

        expect(transformer.transformedValue("foo")).toEqual("foobar");
        expect(transformer.reverseTransformedValue("foobar")).toEqual("foo");
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
