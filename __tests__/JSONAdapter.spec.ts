import { JSONAdapter } from "../lib";
import { TestModel, MultiKeypathModel } from "./TestModel";

describe("JSONAdapter", () => {
    it("should initialize nested key paths from JSON", () => {
        const values = {
            "username": null,
            "count": "5",
        };

        const model = JSONAdapter.modelFromObject<TestModel>(values, TestModel);

        expect(model).toBeDefined();
        expect(model.name).toBeNull();
        expect(model.count).toEqual(5);

        const expected = {
            "username": null,
            "count": "5",
            "nested": {
                "name": undefined
            }
        }

        expect(JSONAdapter.objectFromModel(model)).toEqual(expected);
    });

    it("should initialize nested key paths from JSON", () => {
        const values = {
            "username": "foo",
            "nested": {
                "name": "bar"
            },
            "count": "0"
        };

        const model = JSONAdapter.modelFromObject<TestModel>(values, TestModel);

        expect(model).toBeDefined();
        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toEqual("bar");

        expect(JSONAdapter.objectFromModel(model)).toEqual(values);
    });

    it("it should initialize properties with multiple key paths from JSON", () => {
        const values = {
            "latitude": 20,
            "longitude": 12,
            "nested": {
                "latitude": 12,
                "longitude": 34
            }
        };

        const model = JSONAdapter.modelFromObject<MultiKeypathModel>(values, MultiKeypathModel);

        expect(model).toBeDefined();
        expect(model.location.latitude).toEqual(20);
        expect(model.location.longitude).toEqual(12);

        expect(model.nestedLocation.latitude).toEqual(12);
        expect(model.nestedLocation.longitude).toEqual(34);

        expect(JSONAdapter.objectFromModel(model)).toEqual(values);
    });
});
