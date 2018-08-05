import { Serializable } from "../lib";
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
            const [model, error] = TestModel.fromJSON(JSON.stringify(values));

            expect(model).toBeDefined();
            expect(error).toBeUndefined();

            expect(model.name).toBeNull();
            expect(model.count).toEqual(5);

            expect(model.toObject()).toEqual([expected, undefined]);
            expect(model.toJSON()).toEqual([`{"username":null,"count":"5","nested":{"name":null}}`, undefined]);
        });

        it("should initialize nested key paths from JSON", () => {
            const [model, error] = TestModel.from(values);

            expect(model).toBeDefined();
            expect(error).toBeUndefined();

            expect(model.name).toBeNull();
            expect(model.count).toEqual(5);

            expect(model.toObject()).toEqual([expected, undefined]);
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

        const [model, error] = TestModel.from(values);

        expect(model).toBeDefined();
        expect(error).toBeUndefined();

        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toEqual("bar");

        expect(model.toObject()).toEqual([values, undefined]);
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

        const [model, error] = MultiKeypathModel.from(values);

        expect(model).toBeDefined();
        expect(error).toBeUndefined();

        expect(model.location.latitude).toEqual(20);
        expect(model.location.longitude).toEqual(12);

        expect(model.nestedLocation.latitude).toEqual(12);
        expect(model.nestedLocation.longitude).toEqual(34);

        expect(model.toObject()).toEqual([values, undefined]);
    });


    it("should initialize without returning any error when using a JSON with null as value", () => {
        const values = {
            "username": "foo",
            "nested": null,
            "count": "0",
        };

        const [model, error] = TestModel.from(values);

        expect(model).toBeDefined();
        expect(error).toBeUndefined();

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

        const [model, error] = TestModel.from(values);

        expect(model).toBeDefined();
        expect(error).toBeUndefined();

        expect(model.name).toEqual("buzz");
        expect(model.count).toEqual(2);
        expect(model.nestedName).toEqual("bar");
    });


    it("should fail to initialize if JSON transformer fails", () => {
        const values = {
            "url": 666,
        };

        const [model, error] = URLModel.from(values);

        expect(model).toBeNull();
        expect(error).toBeDefined();
    });

    it("should use JSONTransformerForKey transformer", () => {
        const values = {
            "url": "http://github.com/1",
            "otherUrl": "http://github.com/2",
        };

        const [model, error] = URLSubclassModel.from(values);

        expect(model).toBeDefined();
        expect(error).toBeUndefined();

        expect(model.url).toEqual(new URL("http://github.com/1"));
        expect(model.otherUrl).toEqual(new URL("http://github.com/2"));

        expect(model.toObject()).toEqual([values, undefined]);
    });

    it("should initialize default values", () => {
        const values = {
            "name": "John"
        };

        const [model, error] = DefaultValuesModel.from(values);

        expect(error).toBeUndefined();
        expect(model).toBeDefined();
        expect(model.name).toEqual("John");
        expect(model.foo).toEqual("foo");
    });

    it("should fail to serialize if a JSON transformer errors", () => {
        const model = new URLModel();

        (model.url as any) = "totallyNotAnNSURL";

        const [values, error] = model.toObject();

        expect(values).toBeNull();
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

        const [model, error] = SubstitutingTestModel.from(values) as [TestModel, Error?];

        expect(model).toBeInstanceOf(TestModel);
        expect(error).toBeUndefined();

        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toEqual("bar");

        expect(model.toObject()).toEqual([values, undefined]);
    });

    it("should serialize different model classes", () => {
        const chocolateValues = {
            "flavor": "chocolate",
            "chocolate_bitterness": "100",
        };

        const [chocolateModel, chocolateError] = ClassClusterModel.from(chocolateValues) as [ChocolateClassClusterModel, Error?];

        expect(chocolateError).toBeUndefined();
        expect(chocolateModel).toBeDefined();
        expect(chocolateModel.flavor).toEqual("chocolate");
        expect(chocolateModel.bitterness).toEqual(100);

        expect(chocolateModel.toObject()).toEqual([chocolateValues, undefined]);

        const strawberryValues = {
            "flavor": "strawberry",
            "strawberry_freshness": 20,
        };

        const [strawberryModel, strawberryError] = ClassClusterModel.from(strawberryValues) as [StrawberryClassClusterModel, Error?];

        expect(strawberryError).toBeUndefined();
        expect(strawberryModel).toBeDefined();
        expect(strawberryModel.flavor).toEqual("strawberry");
        expect(strawberryModel.freshness).toEqual(20);

        expect(strawberryModel.toObject()).toEqual([strawberryValues, undefined]);
    });

    it("should return an error when no suitable model class is found", () => {
        const [model, error] = SubstitutingTestModel.from({}) as [TestModel, Error?];

        expect(model).toBeNull();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.JSONAdapterNoClassFound);
    });



    it("should return null model from null input", () => {
        const [model, error] = TestModel.fromJSON(null);

        expect(model).toBeNull();
        expect(error).toBeUndefined();
    });

    it("should ignore invalid transformers", () => {
        const values = {
            "foo": "foo",
            "bar": "bar",
        };

        const [model, error] = InvalidTransformersModel.from(values);

        expect(error).toBeUndefined();
        expect(model).toBeDefined();
        expect(model.foo).toEqual("foo");
        expect(model.bar).toEqual("bar");
    });
});


describe("Deserializing multiple models", () => {
    const values = [
        {
            "username": "foo"
        },
        {
            "username": "bar"
        }
    ];

    it("should initialize models from a JSON string of an array", () => {
        const [models, error] = TestModel.fromJSONArray(JSON.stringify(values));

        expect(error).toBeUndefined();
        expect(models).toBeDefined();
        expect(models.length).toEqual(2);
        expect(models[0].name).toEqual("foo");
        expect(models[1].name).toEqual("bar");
    });

    it("should initialize models from an array of objects", () => {
        const [models, error] = TestModel.fromArray(values);

        expect(error).toBeUndefined();
        expect(models).toBeDefined();
        expect(models.length).toEqual(2);
        expect(models[0].name).toEqual("foo");
        expect(models[1].name).toEqual("bar");
    });

    it("should return null on null input", () => {
        const [models, error] = TestModel.fromArray(null);

        expect(error).toBeUndefined();
        expect(models).toBeNull();
    });

    it("should return error on non-array input", () => {
        const [models, error] = TestModel.fromArray({} as any[]);

        expect(models).toBeNull();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.JSONAdapterInvalidJSON);
    });
});

it("should return undefined and an error if it fails to initialize any model from an array", () => {
    const values = [
        {
            "username": "foo",
            "count": "1"
        },
        {
            "count": ["This won't parse"]
        }
    ];

    const [models, error] = SubstitutingTestModel.fromArray(values);

    expect(error).toBeDefined();
    expect(error.name).toEqual(MantleErrorTypes.JSONAdapterNoClassFound);
    expect(models).toBeNull();
});

it("should return null if it fails to parse any model from an array", () => {
    const values = [
        {
            "username": "foo",
            "count": "1"
        },
        null
    ];

    const [models, error] = SubstitutingTestModel.fromArray(values);

    expect(error).toBeUndefined();
    expect(models).toBeNull();
});

describe("serialize array of objects from models", () => {
    const model1 = new TestModel();
    model1.name = "foo";

    const model2 = new TestModel();
    model2.name = "bar";

    it("should return a JSON array of objects from models", () => {
        const [objects, error] = TestModel.toJSONArray([model1, model2]);

        expect(error).toBeUndefined();
        expect(objects).toBeDefined();

        expect(objects).toEqual(`[{"username":"foo","count":"1","nested":{}},{"username":"bar","count":"1","nested":{}}]`);
    });

    it("should return an array of objects from models", () => {
        const [objects, error] = TestModel.toArray([model1, model2]);

        expect(error).toBeUndefined();

        expect(objects).toBeDefined();
        expect(objects.length).toEqual(2);
        expect(objects[0].username).toEqual("foo");
        expect(objects[1].username).toEqual("bar");
    });

    it("should return null from null models", () => {
        const [objects, error] = TestModel.toArray(null);

        expect(error).toBeUndefined();
        expect(objects).toBeNull();
    });

    it("should throw exception on non-array input", () => {
        const [objects, error] = TestModel.toArray({} as Serializable[]);

        expect(objects).toBeNull();
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

        const [model, error] = RecursiveGroupModel.from(values);

        expect(error).toBeUndefined();
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

        expect(model.toObject()).toEqual([values, undefined]);
    });

    it("should throw error on non-object input", () => {
        const values = {
            "owner_": "foo"
        };

        const [model, error] = RecursiveGroupModel.from(values);

        expect(model).toBeNull();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should throw error on non-array input", () => {
        const values = {
            "users_": {},
        };

        const [model, error] = RecursiveGroupModel.from(values);

        expect(model).toBeNull();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
    });

    it("should throw error if array item is not an object", () => {
        const values = {
            "urls": [
                "foo"
            ]
        };

        const [model, error] = HostedURLsModel.from(values);

        expect(model).toBeNull();
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

        const [model, error] = HostedURLsModel.from(values);

        expect(error).toBeUndefined();
        expect(model).toBeDefined();
        expect(model.urls.length).toEqual(3);
        expect(model.urls[0].url).toEqual(new URL("http://foo.com"));
        expect(model.urls[1]).toBeNull();
        expect(model.urls[2].url).toEqual(new URL("http://bar.com"));

        expect(model.toObject()).toEqual([values, undefined]);
    });

    it("should throw error when deserializing a non-array", () => {
        const model = new HostedURLsModel();
        model.urls = {} as URLModel[];

        const [values, error] = model.toObject();

        expect(values).toBeNull();
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

        const [values, error] = model.toObject();

        expect(values).toBeNull();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.TransformerHandlingInvalidInput);
    });
});
