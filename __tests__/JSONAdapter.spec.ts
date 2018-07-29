import { JSONAdapter } from "../lib";
import { TestModel } from "./TestModel";

describe("JSONAdapter", () => {
    it("should initialize nested key paths from JSON", async () => {
        const values = {
            "username": "foo",
            "nested": {
                "name": "bar"
            }
        };

        const model = JSONAdapter.modelFromObject<TestModel>(values, TestModel);

        expect(model).toBeDefined();
        expect(model.name).toEqual("foo");
        expect(model.nestedName).toEqual("bar");

        expect(JSONAdapter.objectFromModel(model)).toEqual(values);
    });
});
