import { Serializable, ValueTransformer, KeyPaths, Model, Newable } from "../lib";

export const TestModelNameTooLongError = "TestModelNameTooLongError";
export const TestModelNameMissingError = "TestModelNameMissingError";

export class TestModel extends Model {
    /**
     * Must be less than 10 characters.
     *
     * This property is associated with a "username" key in JSON.
     */
    public name: string;

    /**
     * Defaults to 1.
     *
     * This property is a string in JSON.
     */
    public count: number;

    /**
     * This property is associated with a "nested.name" key path in JSON.
     */
    public nestedName: string;

    constructor() {
        super();

        this.count = 1;
    }

    public static JSONKeyPaths(): KeyPaths<TestModel> {
        return {
            name: "username",
            count: "count",
            nestedName: "nested.name",
        };
    }

    public static countJSONTransformer(): ValueTransformer {
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
            },
        );
    }

    /**
     * Merging
     */

    public mergeCountFromModel<T extends TestModel>(model: T): void {
        this.count += model.count;
    }

    /**
     * Validation
     */

    public validateName(): boolean {
        if (this.name == null) {
            return true;
        }

        if (this.name.length < 10) {
            return true;
        }

        const error = new Error(`Expected name to be under 10 characters, got: ${this.name}`);
        error.name = TestModelNameTooLongError;

        throw error;
    }

    public validateCount(): boolean {
        if (this.count < 10) {
            return true;
        }

        return false;
    }
}

export class SubclassTestModel extends TestModel {
    public role: string;
    public generation: number;
}

interface Coordinate {
    latitude: number;
    longitude: number;
}

export class MultiKeypathModel extends Model {
    /**
     * This property is associated with the "latitude" and "longitude" keys in JSON.
     */
    public location: Coordinate;

    /**
     * This property is associated with the "nested.latitude" and "nested.longitude"
     * keys in JSON.
     */
    public nestedLocation: Coordinate;

    public static JSONKeyPaths(): KeyPaths<MultiKeypathModel> {
        return {
            location: ["latitude", "longitude"],
            nestedLocation: ["nested.latitude", "nested.longitude"],
        };
    }

    public static locationJSONTransformer(): ValueTransformer {
        return ValueTransformer.forward(
            (value) => {
                return value;
            },
        );
    }

    public static nestedLocationJSONTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value) => {
                return value.nested;
            },
            (value: Coordinate) => {
                return {
                    "nested": value,
                };
            },
        );
    }
}

export class ValidationModel extends Model {
    /**
     * Defaults to null, which is not considered valid.
     */
    public name: string = null;

    public static JSONKeyPaths(): KeyPaths<ValidationModel> {
        return {
            name: "name",
        };
    }

    public validateName(): boolean {
        if (this.name != null) {
            return true;
        }

        const error = new Error("Expected name to not be null");
        error.name = TestModelNameMissingError;

        throw error;
    }
}

/**
 * Sets the name to "foobar" when `validateName` is invoked with null name.
 */
export class SelfValidatingModel extends ValidationModel {
    public validateName(): boolean {
        /* istanbul ignore if */
        if (this.name != null) {
            return true;
        }

        this.name = "foobar";

        return true;
    }
}

export class URL {
    public url: string;

    constructor(url: string) {
        const re = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;

        if (!re.test(url)) {
            throw new Error(`Invalid url: ${url}`);
        }

        this.url = url;
    }
}

export class URLModel extends Model {
    /**
     * Defaults to http://github.com.
     */
    public url: URL;

    constructor() {
        super();

        this.url = new URL("http://github.com");
    }

    public static JSONKeyPaths(): KeyPaths<URLModel> {
        return {
            url: "url",
        };
    }

    public static urlJSONTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value: string) => {
                return new URL(value);
            },
            (value: URL) => {
                if (value instanceof URL) {
                    return value.url;
                }
                throw new Error("Invalid URL");
            },
        );
    }
}

export class URLSubclassModel extends URLModel {
    /**
     * Defaults to http://foo.com.
     */
    public otherUrl: URL;

    constructor() {
        super();

        this.otherUrl = new URL("http://foo.com");
    }

    public static JSONKeyPaths(): KeyPaths<URLSubclassModel> {
        return {
            ...super.JSONKeyPaths(),
            otherUrl: "otherUrl",
        };
    }

    public static JSONTransformerForKey(key: string): ValueTransformer {
        /* istanbul ignore else */
        if (key === "otherUrl") {
            return URLModel.urlJSONTransformer();
        }
    }
}

/**
 * Conforms to {@link Serializable} but does not inherit from the {@link Model} class.
 */
export class ConformingModel extends Serializable {
    public name: string;

    public static JSONKeyPaths(): KeyPaths<ConformingModel> {
        return {
            name: "name",
        };
    }
}

/**
 * Parses {@link TestModel} objects from JSON instead.
 */
export class SubstitutingTestModel extends Model {
    /* istanbul ignore next */
    public static JSONKeyPaths(): KeyPaths<SubstitutingTestModel> {
        return {};
    }

    public static classForParsingObject(json: any): Newable<Serializable> {
        if (json.username != null) {
            return TestModel;
        }

        return null;
    }
}

export class ClassClusterModel extends Model {
    public flavor: string;

    public static JSONKeyPaths(): KeyPaths<ClassClusterModel> {
        return {
            flavor: "flavor",
        };
    }

    public static classForParsingObject(json: any): Newable<Serializable> {
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
    public bitterness: number;

    public get flavor(): string {
        return "chocolate";
    }

    public static JSONKeyPaths(): KeyPaths<ChocolateClassClusterModel> {
        return {
            ...super.JSONKeyPaths(),
            bitterness: "chocolate_bitterness",
        };
    }

    public static bitternessJSONTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value: string) => {
                return parseInt(value);
            },
            (value: number) => {
                return value.toString();
            },
        );
    }
}

export class StrawberryClassClusterModel extends ClassClusterModel {
    /**
     * Associated with the "strawberry_freshness" JSON key.
     */
    public freshness: number;

    public get flavor(): string {
        return "strawberry";
    }

    public static JSONKeyPaths(): KeyPaths<StrawberryClassClusterModel> {
        return {
            ...super.JSONKeyPaths(),
            freshness: "strawberry_freshness",
        };
    }
}

export class RecursiveUserModel extends Model {
    public name: string;
    public groups: RecursiveGroupModel[];

    public static JSONKeyPaths(): KeyPaths<RecursiveUserModel> {
        return {
            name: "name_",
            groups: "groups_",
        };
    }

    public static groupsJSONTransformer(): ValueTransformer {
        return ValueTransformer.arrayTransformer(RecursiveGroupModel);
    }
}

export class RecursiveGroupModel extends Model {
    public owner: RecursiveUserModel;
    public users: RecursiveUserModel[];

    public static JSONKeyPaths(): KeyPaths<RecursiveGroupModel> {
        return {
            owner: "owner_",
            users: "users_",
        };
    }

    public static ownerJSONTransformer(): ValueTransformer {
        return ValueTransformer.objectTransformer(RecursiveUserModel);
    }

    public static usersJSONTransformer(): ValueTransformer {
        return ValueTransformer.arrayTransformer(RecursiveUserModel);
    }
}

export class HostedURLsModel extends Model {
    public urls: URLModel[];

    public static JSONKeyPaths(): KeyPaths<HostedURLsModel> {
        return {
            urls: "urls",
        };
    }

    public static urlsJSONTransformer(): ValueTransformer {
        return ValueTransformer.arrayTransformer(URLModel);
    }
}

export class DefaultValuesModel extends Model {
    public name: string;

    /**
     * Defaults to foo
     */
    public foo: string;

    constructor() {
        super();

        this.foo = "foo";
    }

    public static JSONKeyPaths(): KeyPaths<DefaultValuesModel> {
        return {
            name: "name",
        };
    }
}

export class InvalidTransformersModel extends Model {
    public foo: string;
    public bar: string;

    public static JSONKeyPaths(): KeyPaths<InvalidTransformersModel> {
        return {
            foo: "foo",
            bar: "bar",
        };
    }

    public static fooJSONTransformer(): ValueTransformer {
        return null;
    }

    public static JSONTransformerForKey(): ValueTransformer {
        return null;
    }
}
