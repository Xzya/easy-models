import { TestModel, SubclassTestModel } from "./TestModel";

describe("Model", () => {
    describe("merging", () => {
        it("should merge two models together", () => {
            const target = new TestModel();
            target.name = "foo";
            target.count = 5;

            const source = new TestModel();
            source.name = "bar";
            source.count = 3;

            target.mergeValues(source);

            expect(target.name).toEqual("bar");
            expect(target.count).toEqual(8);
        });

        it("should not modify values when merging null", () => {
            const target = new TestModel();
            target.name = "foo";

            target.mergeValue("name", null);

            expect(target.name).toEqual("foo");

            target.mergeValues(null);

            expect(target.name).toEqual("foo");
        });

        describe("merging with model subclasses", () => {
            let superclass: TestModel;
            let subclass: SubclassTestModel;

            beforeEach(() => {
                superclass = new TestModel();
                superclass.name = "foo";
                superclass.count = 5;

                subclass = new SubclassTestModel();
                subclass.name = "bar";
                subclass.count = 3;
                subclass.generation = 1;
                subclass.role = "subclass";
            });

            it("should merge from subclass model", () => {
                superclass.mergeValues(subclass);

                expect(superclass.name).toEqual("bar");
                expect(superclass.count).toEqual(8);
            });

            it("should merge from superclass model", () => {
                subclass.mergeValues(superclass);

                expect(subclass.name).toEqual("foo");
                expect(subclass.count).toEqual(8);
                expect(subclass.generation).toEqual(1);
                expect(subclass.role).toEqual("subclass");
            });
        });
    });
});
