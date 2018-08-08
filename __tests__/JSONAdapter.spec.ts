import { Serializable } from "../lib";
import {
    TestModel, MultiKeypathModel, URLModel, SubstitutingTestModel, ChocolateClassClusterModel, StrawberryClassClusterModel,
    RecursiveGroupModel, URLSubclassModel, URL, HostedURLsModel, DefaultValuesModel, ClassClusterModel, InvalidTransformersModel,
} from "./TestModel";
import { ErrorTypes } from "../lib/constants";

describe("JSONAdapter", () => {
    describe("serialize nested key paths", () => {
        const values = {
            "username": null,
            "count": "5",
        };

        const expected = {
            "username": null,
            "count": "5",
            "nested": {
                "name": null,
            },
        };

        it("should initialize nested key paths from JSON", () => {
            const model = TestModel.from(values);

            expect(model).toBeDefined();
            expect(model.name).toBeNull();
            expect(model.count).toEqual(5);

            expect(model.toJSON()).toEqual(expected);
        });
    });

    it("should return null when serializing to JSON with invalid data", () => {
        const model = new URLModel();
        model.url = "" as any;

        expect(model.toJSON()).toBeNull();
    });

    it("should initialize nested key paths from JSON", () => {
        const values = {
            "username": "foo",
            "nested": {
                "name": "bar",
            },
            "count": "0",
        };

        const model = TestModel.from(values);

        expect(model).toBeDefined();
        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toEqual("bar");

        expect(model.toJSON()).toEqual(values);
    });

    it("it should initialize properties with multiple key paths from JSON", () => {
        const values = {
            "latitude": 20,
            "longitude": 12,
            "nested": {
                "latitude": 12,
                "longitude": 34,
            },
        };

        const model = MultiKeypathModel.from(values);

        expect(model).toBeDefined();
        expect(model.location.latitude).toEqual(20);
        expect(model.location.longitude).toEqual(12);
        expect(model.nestedLocation.latitude).toEqual(12);
        expect(model.nestedLocation.longitude).toEqual(34);

        expect(model.toJSON()).toEqual(values);
    });

    it("should initialize without returning any error when using a JSON with null as value", () => {
        const values = {
            "username": "foo",
            "nested": null,
            "count": "0",
        };

        const model = TestModel.from(values);

        expect(model).toBeDefined();
        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toBeNull();
    });

    it("should ignore unrecognized JSON keys", () => {
        const values = {
            "foobar": "foo",
            "count": "2",
            "_": null,
            "username": "buzz",
            "nested": {
                "name": "bar",
                "stuffToIgnore": 5,
                "moreNonsense": null,
            },
        };

        const model = TestModel.from(values);

        expect(model).toBeDefined();
        expect(model.name).toEqual("buzz");
        expect(model.count).toEqual(2);
        expect(model.nestedName).toEqual("bar");
    });

    it("should fail to initialize if JSON transformer fails", () => {
        const values = {
            "url": 666,
        };

        let model: URLModel;
        let error: Error;

        try {
            model = URLModel.from(values);
        } catch (err) {
            error = err;
        }

        expect(model).toBeUndefined();
        expect(error).toBeDefined();
    });

    it("should use JSONTransformerForKey transformer", () => {
        const values = {
            "url": "http://github.com/1",
            "otherUrl": "http://github.com/2",
        };

        const model = URLSubclassModel.from(values);

        expect(model).toBeDefined();
        expect(model.url).toEqual(new URL("http://github.com/1"));
        expect(model.otherUrl).toEqual(new URL("http://github.com/2"));

        expect(model.toJSON()).toEqual(values);
    });

    it("should initialize default values", () => {
        const values = {
            "name": "John",
        };

        const model = DefaultValuesModel.from(values);

        expect(model).toBeDefined();
        expect(model.name).toEqual("John");
        expect(model.foo).toEqual("foo");
    });

    it("should fail to serialize if a JSON transformer errors", () => {
        const model = new URLModel();

        (model.url as any) = "totallyNotAnNSURL";

        let values: any;
        let error: Error;

        try {
            values = model.toObject();
        } catch (err) {
            error = err;
        }

        expect(values).toBeUndefined();
        expect(error).toBeDefined();
    });

    it("should parse a different model class", () => {
        const values = {
            "username": "foo",
            "nested": {
                "name": "bar",
            },
            "count": "0",
        };

        const model = SubstitutingTestModel.from(values) as TestModel;

        expect(model).toBeInstanceOf(TestModel);
        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toEqual("bar");

        expect(model.toJSON()).toEqual(values);
    });

    it("should serialize different model classes", () => {
        const chocolateValues = {
            "flavor": "chocolate",
            "chocolate_bitterness": "100",
        };

        const chocolateModel = ClassClusterModel.from(chocolateValues) as ChocolateClassClusterModel;

        expect(chocolateModel).toBeDefined();
        expect(chocolateModel.flavor).toEqual("chocolate");
        expect(chocolateModel.bitterness).toEqual(100);

        expect(chocolateModel.toJSON()).toEqual(chocolateValues);

        const strawberryValues = {
            "flavor": "strawberry",
            "strawberry_freshness": 20,
        };

        const strawberryModel = ClassClusterModel.from(strawberryValues) as StrawberryClassClusterModel;

        expect(strawberryModel).toBeDefined();
        expect(strawberryModel.flavor).toEqual("strawberry");
        expect(strawberryModel.freshness).toEqual(20);

        expect(strawberryModel.toJSON()).toEqual(strawberryValues);
    });

    it("should return an error when no suitable model class is found", () => {
        let model: TestModel;
        let error: Error;

        try {
            model = SubstitutingTestModel.from({}) as TestModel;
        } catch (err) {
            error = err;
        }

        expect(model).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(ErrorTypes.JSONAdapterNoClassFound);
    });

    it("should ignore invalid transformers", () => {
        const values = {
            "foo": "foo",
            "bar": "bar",
        };

        const model = InvalidTransformersModel.from(values);

        expect(model).toBeDefined();
        expect(model.foo).toEqual("foo");
        expect(model.bar).toEqual("bar");
    });
});

describe("Deserializing multiple models", () => {
    const values = [
        {
            "username": "foo",
        },
        {
            "username": "bar",
        },
    ];

    it("should initialize models from an array of objects", () => {
        const models = TestModel.fromArray(values);

        expect(models).toBeDefined();
        expect(models.length).toEqual(2);
        expect(models[0].name).toEqual("foo");
        expect(models[1].name).toEqual("bar");
    });

    it("should return null on null input", () => {
        const models = TestModel.fromArray(null);

        expect(models).toBeNull();
    });

    it("should return error on non-array input", () => {
        let models: TestModel[];
        let error: Error;

        try {
            models = TestModel.fromArray({} as any[]);
        } catch (err) {
            error = err;
        }

        expect(models).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(ErrorTypes.JSONAdapterInvalidJSON);
    });
});

it("should return undefined and an error if it fails to initialize any model from an array", () => {
    const values = [
        {
            "username": "foo",
            "count": "1",
        },
        {
            "count": ["This won't parse"],
        },
    ];

    let models: SubstitutingTestModel[];
    let error: Error;

    try {
        models = SubstitutingTestModel.fromArray(values);
    } catch (err) {
        error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toEqual(ErrorTypes.JSONAdapterNoClassFound);
    expect(models).toBeUndefined();
});

it("should return null if it fails to parse any model from an array", () => {
    const values = [
        {
            "username": "foo",
            "count": "1",
        },
        null,
    ];

    const models = SubstitutingTestModel.fromArray(values);

    expect(models).toBeNull();
});

describe("serialize array of objects from models", () => {
    const model1 = TestModel.create({
        name: "foo",
    });

    const model2 = TestModel.create({
        name: "bar",
    });

    it("should return an array of objects from models", () => {
        const objects = TestModel.toArray([model1, model2]);

        expect(objects).toBeDefined();
        expect(objects.length).toEqual(2);
        expect(objects[0].username).toEqual("foo");
        expect(objects[1].username).toEqual("bar");
    });

    it("should return null from null models", () => {
        const objects = TestModel.toArray(null);

        expect(objects).toBeNull();
    });

    it("should throw exception on non-array input", () => {
        let objects: any[];
        let error: Error;

        try {
            objects = TestModel.toArray({} as Serializable[]);
        } catch (err) {
            error = err;
        }

        expect(objects).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(ErrorTypes.JSONAdapterInvalidJSON);
    });
});

describe("recursive models", () => {
    it("should support recursive models", () => {
        const values = {
            "owner_": {
                "name_": "Cameron",
                "groups_": [
                    {
                        "owner_": {
                            "name_": "Jane",
                            "groups_": null,
                        },
                        "users_": null,
                    },
                ],
            },
            "users_": [
                {
                    "name_": "Dimitri",
                    "groups_": [
                        {
                            "owner_": {
                                "name_": "Doe",
                                "groups_": [
                                    {
                                        "owner_": {
                                            "name_": "X",
                                            "groups_": null,
                                        },
                                        "users_": null,
                                    },
                                ],
                            },
                            "users_": null,
                        },
                        {
                            "owner_": null,
                            "users_": null,
                        },
                    ],
                },
                {
                    "name_": "John",
                    "groups_": null,
                },
            ],
        };

        const model = RecursiveGroupModel.from(values);

        expect(model).toBeDefined();
        expect(model.owner).toBeDefined();
        expect(model.owner.name).toEqual("Cameron");
        expect(model.owner.groups).toBeDefined();
        expect(model.owner.groups.length).toEqual(1);
        expect(model.owner.groups[0].owner).toBeDefined();
        expect(model.owner.groups[0].owner.name).toEqual("Jane");
        expect(model.users).toBeDefined();
        expect(model.users.length).toEqual(2);
        expect(model.users[0].name).toEqual("Dimitri");
        expect(model.users[0].groups).toBeDefined();
        expect(model.users[0].groups.length).toEqual(2);
        expect(model.users[0].groups[0].owner).toBeDefined();
        expect(model.users[0].groups[0].owner.name).toEqual("Doe");
        expect(model.users[0].groups[0].owner.groups).toBeDefined();
        expect(model.users[0].groups[0].owner.groups.length).toEqual(1);
        expect(model.users[0].groups[0].owner.groups[0].owner).toBeDefined();
        expect(model.users[0].groups[0].owner.groups[0].owner.name).toEqual("X");
        expect(model.users[0].groups[1].owner).toBeNull();
        expect(model.users[0].groups[1].users).toBeNull();

        expect(model.toJSON()).toEqual(values);
    });

    it("should throw error on non-object input", () => {
        const values = {
            "owner_": "foo",
        };

        let model: RecursiveGroupModel;
        let error: Error;

        try {
            model = RecursiveGroupModel.from(values);
        } catch (err) {
            error = err;
        }

        expect(model).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(ErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should throw error on non-array input", () => {
        const values = {
            "users_": {},
        };

        let model: RecursiveGroupModel;
        let error: Error;

        try {
            model = RecursiveGroupModel.from(values);
        } catch (err) {
            error = err;
        }

        expect(model).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(ErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should throw error if array item is not an object", () => {
        const values = {
            "urls": [
                "foo",
            ],
        };

        let model: HostedURLsModel;
        let error: Error;

        try {
            model = HostedURLsModel.from(values);
        } catch (err) {
            error = err;
        }

        expect(model).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(ErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should add null values to parsed array", () => {
        const values = {
            "urls": [
                {
                    "url": "http://foo.com",
                },
                null,
                {
                    "url": "http://bar.com",
                },
            ],
        };

        const model = HostedURLsModel.from(values);

        expect(model).toBeDefined();
        expect(model.urls.length).toEqual(3);
        expect(model.urls[0].url).toEqual(new URL("http://foo.com"));
        expect(model.urls[1]).toBeNull();
        expect(model.urls[2].url).toEqual(new URL("http://bar.com"));

        expect(model.toJSON()).toEqual(values);
    });

    it("should throw error when deserializing a non-array", () => {
        const model = new HostedURLsModel();
        model.urls = {} as URLModel[];

        let values: any;
        let error: Error;

        try {
            values = model.toObject();
        } catch (err) {
            error = err;
        }

        expect(values).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(ErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should throw error when deserializing a non-object inside array", () => {
        const url = new URLModel();
        url.url = new URL("http://foo.com");

        const model = new HostedURLsModel();
        model.urls = [
            url,
            "foo",
        ] as URLModel[];

        let values: any;
        let error: Error;

        try {
            values = model.toObject();
        } catch (err) {
            error = err;
        }

        expect(values).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(ErrorTypes.TransformerHandlingInvalidInput);
    });
});
