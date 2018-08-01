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
