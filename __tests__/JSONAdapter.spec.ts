import { Serializable, ModelFromJSON, ObjectFromModel, ModelFromObject, ModelsFromJSONArray, ModelsFromArray, JSONArrayFromModels, ArrayFromModels } from "../lib";
import { TestModel, MultiKeypathModel, URLModel, SubstitutingTestModel, ChocolateClassClusterModel, StrawberryClassClusterModel, RecursiveGroupModel, URLSubclassModel, URL, HostedURLsModel, DefaultValuesModel, ClassClusterModel, InvalidTransformersModel } from "./TestModel";
import { MantleErrorTypes } from "../lib/constants";

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
                "name": null
            }
        };

        it("should initialize nested key paths from JSON string", () => {
            let model: TestModel;
            let error: Error | undefined;

            try {
                model = ModelFromJSON(JSON.stringify(values), TestModel);
            } catch (err) {
                error = err;
            }

            expect(model).toBeDefined();
            expect(error).not.toBeDefined();

            expect(model.name).toBeNull();
            expect(model.count).toEqual(5);

            expect(ObjectFromModel(model)).toEqual(expected);
        });

        it("should initialize nested key paths from JSON", () => {
            let model: TestModel;
            let error: Error | undefined;

            try {
                model = ModelFromObject(values, TestModel);
            } catch (err) {
                error = err;
            }

            expect(model).toBeDefined();
            expect(error).not.toBeDefined();

            expect(model.name).toBeNull();
            expect(model.count).toEqual(5);

            expect(ObjectFromModel(model)).toEqual(expected);
        });
    });

    it("should initialize nested key paths from JSON", () => {
        const values = {
            "username": "foo",
            "nested": {
                "name": "bar"
            },
            "count": "0"
        };

        let model: TestModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, TestModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toEqual("bar");

        expect(ObjectFromModel(model)).toEqual(values);
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

        let model: MultiKeypathModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, MultiKeypathModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

        expect(model.location.latitude).toEqual(20);
        expect(model.location.longitude).toEqual(12);

        expect(model.nestedLocation.latitude).toEqual(12);
        expect(model.nestedLocation.longitude).toEqual(34);

        expect(ObjectFromModel(model)).toEqual(values);
    });


    it("should initialize without returning any error when using a JSON with null as value", () => {
        const values = {
            "username": "foo",
            "nested": null,
            "count": "0",
        };

        let model: TestModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, TestModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

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

        let model: TestModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, TestModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

        expect(model.name).toEqual("buzz");
        expect(model.count).toEqual(2);
        expect(model.nestedName).toEqual("bar");
    });


    it("should fail to initialize if JSON transformer fails", () => {
        const values = {
            "url": 666,
        };

        let model: URLModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, URLModel);
        } catch (err) {
            error = err;
        }

        expect(model).not.toBeDefined();
        expect(error).toBeDefined();
    });

    it("should use JSONTransformerForKey transformer", () => {
        const values = {
            "url": "http://github.com/1",
            "otherUrl": "http://github.com/2",
        };

        let model: URLSubclassModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, URLSubclassModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

        expect(model.url).toEqual(new URL("http://github.com/1"));
        expect(model.otherUrl).toEqual(new URL("http://github.com/2"));

        expect(ObjectFromModel(model)).toEqual(values);
    });

    it("should initialize default values", () => {
        const values = {
            "name": "John"
        };

        let model: DefaultValuesModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, DefaultValuesModel);
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
        expect(model).toBeDefined();
        expect(model.name).toEqual("John");
        expect(model.foo).toEqual("foo");
    });

    it("should fail to serialize if a JSON transformer errors", () => {
        const model = new URLModel();

        (model.url as any) = "totallyNotAnNSURL";

        let object: any;
        let error: Error | undefined;

        try {
            object = ObjectFromModel(model);
        } catch (err) {
            error = err;
        }

        expect(object).not.toBeDefined();
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

        let model: TestModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, SubstitutingTestModel) as TestModel;
        } catch (err) {
            error = err;
        }

        expect(model).toBeInstanceOf(TestModel);
        expect(error).not.toBeDefined();

        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toEqual("bar");

        expect(ObjectFromModel(model)).toEqual(values);
    });

    it("should serialize different model classes", () => {
        const chocolateValues = {
            "flavor": "chocolate",
            "chocolate_bitterness": "100",
        };

        let chocolateModel: ChocolateClassClusterModel;
        let error: Error | undefined;

        try {
            chocolateModel = ModelFromObject(chocolateValues, ClassClusterModel) as ChocolateClassClusterModel;
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
        expect(chocolateModel).toBeDefined();
        expect(chocolateModel.flavor).toEqual("chocolate");
        expect(chocolateModel.bitterness).toEqual(100);

        expect(ObjectFromModel(chocolateModel)).toEqual(chocolateValues);

        const strawberryValues = {
            "flavor": "strawberry",
            "strawberry_freshness": 20,
        };

        let strawberryModel: StrawberryClassClusterModel;

        try {
            strawberryModel = ModelFromObject(strawberryValues, ClassClusterModel) as StrawberryClassClusterModel;
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
        expect(strawberryModel).toBeDefined();
        expect(strawberryModel.flavor).toEqual("strawberry");
        expect(strawberryModel.freshness).toEqual(20);

        expect(ObjectFromModel(strawberryModel)).toEqual(strawberryValues);
    });

    it("should return an error when no suitable model class is found", () => {
        let model: TestModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject({}, SubstitutingTestModel) as TestModel;
        } catch (err) {
            error = err;
        }

        expect(model).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.JSONAdapterNoClassFound);
    });


    it("should return null model from null input", () => {
        let model: TestModel;
        let error: Error | undefined;

        try {
            model = ModelFromJSON(null, TestModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeNull();
        expect(error).not.toBeDefined();
    });

    it("should ignore invalid transformers", () => {
        const values = {
            "foo": "foo",
            "bar": "bar",
        };

        let model: InvalidTransformersModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, InvalidTransformersModel);
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
        expect(model).toBeDefined();
        expect(model.foo).toEqual("foo");
        expect(model.bar).toEqual("bar");
    });
});


describe("Deserializing multiple models", () => {
    const jsonModels = [
        {
            "username": "foo"
        },
        {
            "username": "bar"
        }
    ];

    it("should initialize models from a JSON string of an array", () => {
        let models: TestModel[];
        let error: Error | undefined;

        try {
            models = ModelsFromJSONArray(JSON.stringify(jsonModels), TestModel);
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeDefined();
        expect(models).toBeDefined();
        expect(models.length).toEqual(2);
        expect(models[0].name).toEqual("foo");
        expect(models[1].name).toEqual("bar");
    });

    it("should initialize models from an array of objects", () => {
        let models: TestModel[];
        let error: Error | undefined;

        try {
            models = ModelsFromArray(jsonModels, TestModel);
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeDefined();
        expect(models).toBeDefined();
        expect(models.length).toEqual(2);
        expect(models[0].name).toEqual("foo");
        expect(models[1].name).toEqual("bar");
    });

    it("should return null on null input", () => {
        let models: TestModel[];
        let error: Error | undefined;

        try {
            models = ModelsFromArray(null, TestModel);
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeDefined();
        expect(models).toBeNull();
    });

    it("should return error on non-array input", () => {
        let models: TestModel[];
        let error: Error | undefined;

        try {
            models = ModelsFromArray({} as any[], TestModel);
        } catch (err) {
            error = err;
        }

        expect(models).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.JSONAdapterInvalidJSON);
    });
});

it("should return undefined and an error if it fails to initialize any model from an array", () => {
    const jsonModels = [
        {
            "username": "foo",
            "count": "1"
        },
        {
            "count": ["This won't parse"]
        }
    ];

    let models: SubstitutingTestModel[];
    let error: Error | undefined;

    try {
        models = ModelsFromArray(jsonModels, SubstitutingTestModel);
    } catch (err) {
        error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toEqual(MantleErrorTypes.JSONAdapterNoClassFound);
    expect(models).toBeUndefined();
});

it("should return null if it fails to parse any model from an array", () => {
    const jsonModels = [
        {
            "username": "foo",
            "count": "1"
        },
        null
    ];

    let models: SubstitutingTestModel[];
    let error: Error | undefined;

    try {
        models = ModelsFromArray(jsonModels, SubstitutingTestModel);
    } catch (err) {
        error = err;
    }

    expect(error).not.toBeDefined();
    expect(models).toBeNull();
});

describe("serialize array of objects from models", () => {
    const model1 = new TestModel();
    model1.name = "foo";

    const model2 = new TestModel();
    model2.name = "bar";

    it("should return a JSON array of objects from models", () => {
        let objects: string | undefined;
        let error: Error | undefined;

        try {
            objects = JSONArrayFromModels([model1, model2]);
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeDefined();
        expect(objects).toBeDefined();
    });

    it("should return an array of objects from models", () => {
        let objects: any[];
        let error: Error | undefined;

        try {
            objects = ArrayFromModels([model1, model2]);
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeDefined();

        expect(objects).toBeDefined();
        expect(objects.length).toEqual(2);
        expect(objects[0].username).toEqual("foo");
        expect(objects[1].username).toEqual("bar");
    });

    it("should return null from null models", () => {
        let objects: any[];
        let error: Error | undefined;

        try {
            objects = ArrayFromModels(null);
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
        expect(objects).toBeNull();
    });

    it("should throw exception on non-array input", () => {
        let objects: any[];
        let error: Error | undefined;

        try {
            objects = ArrayFromModels({} as Serializable[]);
        } catch (err) {
            error = err;
        }

        expect(objects).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.JSONAdapterInvalidJSON);
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
                            "groups_": null
                        },
                        "users_": null
                    }
                ]
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
                                            "groups_": null
                                        },
                                        "users_": null
                                    }
                                ]
                            },
                            "users_": null
                        },
                        {
                            "owner_": null,
                            "users_": null
                        }
                    ]
                },
                {
                    "name_": "John",
                    "groups_": null
                }
            ]
        };

        let model: RecursiveGroupModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, RecursiveGroupModel);
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeDefined();
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

        expect(ObjectFromModel(model)).toEqual(values);
    });

    it("should throw error on non-object input", () => {
        const values = {
            "owner_": "foo"
        };

        let model: RecursiveGroupModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, RecursiveGroupModel);
        } catch (err) {
            error = err;
        }

        expect(model).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should throw error on non-array input", () => {
        const values = {
            "users_": {},
        };

        let model: RecursiveGroupModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, RecursiveGroupModel);
        } catch (err) {
            error = err;
        }

        expect(model).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should throw error if array item is not an object", () => {
        const values = {
            "urls": [
                "foo"
            ]
        };

        let model: HostedURLsModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, HostedURLsModel);
        } catch (err) {
            error = err;
        }

        expect(model).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should add null values to parsed array", () => {
        const values = {
            "urls": [
                {
                    "url": "http://foo.com"
                },
                null,
                {
                    "url": "http://bar.com"
                },
            ]
        };

        let model: HostedURLsModel;
        let error: Error | undefined;

        try {
            model = ModelFromObject(values, HostedURLsModel);
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeDefined();
        expect(model).toBeDefined();
        expect(model.urls.length).toEqual(3);
        expect(model.urls[0].url).toEqual(new URL("http://foo.com"));
        expect(model.urls[1]).toBeNull();
        expect(model.urls[2].url).toEqual(new URL("http://bar.com"));

        expect(ObjectFromModel(model)).toEqual(values);
    });

    it("should throw error when deserializing a non-array", () => {
        const model = new HostedURLsModel();
        model.urls = {} as URLModel[];

        let values: any;
        let error: Error | undefined;

        try {
            values = ObjectFromModel(model);
        } catch (err) {
            error = err;
        }

        expect(values).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
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
        let error: Error | undefined;

        try {
            values = ObjectFromModel(model);
        } catch (err) {
            error = err;
        }

        expect(values).toBeUndefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
    });
});
