import { Serializable, ValueTransformer, ModelClass, JSONAdapter, KeyPaths } from "../lib";

export class TestModel extends Serializable {
    /**
     * Must be less than 10 characters.
     * 
     * This property is associated with a "username" key in JSON.
     */
    name: string;

    /**
     * Defaults to 1.
     * 
     * This property is a string in JSON.
     */
    count: number;

    /**
     * This property is associated with a "nested.name" key path in JSON.
     */
    nestedName: string;

    constructor() {
        super();

        this.count = 1;
    }

    static JSONKeyPaths(): KeyPaths<TestModel> {
        return {
            "name": "username",
            "count": "count",
            "nestedName": "nested.name",
        };
    }

    static countJSONTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value: string) => {
                const result = parseInt(value);
                if (!isNaN(result)) {
                    return result;
                }
                return null;
            },
            (value?: number) => {
                /* istanbul ignore else */
                if (value != null) {
                    return value.toString();
                }
                /* istanbul ignore next */
                return null;
            }
        )
    }
}

interface Coordinate {
    latitude: number;
    longitude: number;
}

export class MultiKeypathModel extends Serializable {
    /**
     * This property is associated with the "latitude" and "longitude" keys in JSON.
     */
    location: Coordinate;

    /**
     * This property is associated with the "nested.latitude" and "nested.longitude"
     * keys in JSON.
     */
    nestedLocation: Coordinate;

    static JSONKeyPaths(): KeyPaths<MultiKeypathModel> {
        return {
            "location": ["latitude", "longitude"],
            "nestedLocation": ["nested.latitude", "nested.longitude"]
        };
    }

    static locationJSONTransformer(): ValueTransformer {
        return ValueTransformer.forward(
            (value) => {
                return value;
            }
        );
    }

    static nestedLocationJSONTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value) => {
                return value.nested;
            },
            (value: Coordinate) => {
                return {
                    "nested": value
                };
            }
        )
    }
}

export class URL {
    url: string;

    constructor(url: string) {
        const re = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;

        if (!re.test(url)) {
            throw new Error(`Invalid url: ${url}`);
        }

        this.url = url;
    }
}

export class URLModel extends Serializable {
    /**
     * Defaults to http://github.com.
     */
    url: URL;

    constructor() {
        super();

        this.url = new URL("http://github.com");
    }

    static JSONKeyPaths(): KeyPaths<URLModel> {
        return {
            "url": "url",
        };
    }

    static urlJSONTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value: string) => {
                return new URL(value);
            },
            (value: URL) => {
                if (value instanceof URL) {
                    return value.url;
                }
                throw new Error("Invalid URL");
            }
        )
    }
}

export class URLSubclassModel extends URLModel {
    /**
     * Defaults to http://foo.com.
     */
    otherUrl: URL;

    constructor() {
        super();

        this.otherUrl = new URL("http://foo.com");
    }

    static JSONKeyPaths(): KeyPaths<URLSubclassModel> {
        return {
            ...super.JSONKeyPaths(),
            "otherUrl": "otherUrl",
        };
    }

    static JSONTransformerForKey(key: string): ValueTransformer {
        /* istanbul ignore else */
        if (key === "otherUrl") {
            return URLModel.urlJSONTransformer();
        }
    }
}

/**
 * Parses MTLTestModel objects from JSON instead.
 */
export class SubstitutingTestModel extends Serializable {
    /* istanbul ignore next */
    static JSONKeyPaths(): KeyPaths<SubstitutingTestModel> {
        return {};
    }

    static classForParsingObject(json: any): ModelClass {
        if (json.username != null) {
            return TestModel;
        }
        return null;
    }
}

export class ClassClusterModel extends Serializable {
    flavor: string;

    static JSONKeyPaths(): KeyPaths<ClassClusterModel> {
        return {
            "flavor": "flavor",
        };
    }

    static classForParsingObject(json: any): ModelClass {
        if (json.flavor === "chocolate") {
            return ChocolateClassClusterModel;
        }

        /* istanbul ignore else */
        if (json.flavor === "strawberry") {
            return StrawberryClassClusterModel;
        }
    }
}

export class ChocolateClassClusterModel extends ClassClusterModel {
    /**
     * Associated with the "chocolate_bitterness" JSON key and transformed to a string.
     */
    bitterness: number;

    get flavor(): string {
        return "chocolate";
    }

    static JSONKeyPaths(): KeyPaths<ChocolateClassClusterModel> {
        return {
            ...super.JSONKeyPaths(),
            "bitterness": "chocolate_bitterness",
        };
    }

    static bitternessJSONTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value: string) => {
                return parseInt(value);
            },
            (value: number) => {
                return value.toString();
            }
        )
    }
}

export class StrawberryClassClusterModel extends ClassClusterModel {
    /**
     * Associated with the "strawberry_freshness" JSON key.
     */
    freshness: number;

    get flavor(): string {
        return "strawberry";
    }

    static JSONKeyPaths(): KeyPaths<StrawberryClassClusterModel> {
        return {
            ...super.JSONKeyPaths(),
            "freshness": "strawberry_freshness",
        };
    }
}

export class RecursiveUserModel extends Serializable {
    name: string;
    groups: RecursiveGroupModel[];

    static JSONKeyPaths() {
        return {
            "name": "name_",
            "groups": "groups_",
        };
    }

    static groupsJSONTransformer(): ValueTransformer {
        return JSONAdapter.arrayTransformerWithModelClass(RecursiveGroupModel);
    }
}

export class RecursiveGroupModel extends Serializable {
    owner: RecursiveUserModel;
    users: RecursiveUserModel[];

    static JSONKeyPaths(): KeyPaths<RecursiveGroupModel> {
        return {
            "owner": "owner_",
            "users": "users_",
        };
    }

    static ownerJSONTransformer(): ValueTransformer {
        return JSONAdapter.dictionaryTransformerWithModelClass(RecursiveUserModel);
    }

    static usersJSONTransformer(): ValueTransformer {
        return JSONAdapter.arrayTransformerWithModelClass(RecursiveUserModel);
    }
}

export class HostedURLsModel extends Serializable {
    urls: URLModel[];

    static JSONKeyPaths(): KeyPaths<HostedURLsModel> {
        return {
            "urls": "urls",
        };
    }

    static urlsJSONTransformer(): ValueTransformer {
        return JSONAdapter.arrayTransformerWithModelClass(URLModel);
    }
}

export class DefaultValuesModel extends Serializable {
    name: string;

    /**
     * Defaults to foo
     */
    foo: string;

    constructor() {
        super();

        this.foo = "foo";
    }

    static JSONKeyPaths(): KeyPaths<DefaultValuesModel> {
        return {
            name: "name",
        };
    }
}

export class InvalidTransformersModel extends Serializable {
    foo: string;
    bar: string;

    static JSONKeyPaths(): KeyPaths<InvalidTransformersModel> {
        return {
            foo: "foo",
            bar: "bar",
        };
    }

    static fooJSONTransformer() {
        return null;
    }

    static JSONTransformerForKey() {
        return null;
    }
}
