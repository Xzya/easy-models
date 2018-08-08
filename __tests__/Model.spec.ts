import { TestModel, SubclassTestModel } from "./TestModel";

describe("Model", () => {
    describe("merging", () => {
        it("should merge two models together", () => {
            const target = TestModel.create({
                name: "foo",
                count: 5,
            });

            const source = TestModel.create({
                name: "bar",
                count: 3,
            });

            target.mergeValues(source);

            expect(target.name).toEqual("bar");
            expect(target.count).toEqual(8);
        });

        it("should not modify values when merging null", () => {
            const target = TestModel.create({
                name: "foo",
            });

            target.mergeValue("name", null);

            expect(target.name).toEqual("foo");

            target.mergeValues(null);

            expect(target.name).toEqual("foo");
        });

        describe("merging with model subclasses", () => {
            let superclass: TestModel;
            let subclass: SubclassTestModel;

            beforeEach(() => {
                superclass = TestModel.create({
                    name: "foo",
                    count: 5,
                });

                subclass = SubclassTestModel.create({
                    name: "bar",
                    count: 3,
                    generation: 1,
                    role: "subclass",
                });
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
