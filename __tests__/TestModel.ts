import { JSONSerializable, ValueTransformer, ModelClass } from "../lib";
import { URL } from "url";

export class TestModel extends JSONSerializable {
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

    static JSONKeyPathsByPropertyKey() {
        return {
            "name": "username",
            "count": "count",
            "nestedName": "nested.name",
        };
    }

    static countJSONTransformer(): ValueTransformer {
        return ValueTransformer.usingForwardAndReversibleBlocks(
            (value: string) => {
                const result = parseInt(value);
                if (!isNaN(result)) {
                    return result;
                }
                return null;
            },
            (value?: number) => {
                if (value != null) {
                    return value.toString();
                }
                return null;
            }
        )
    }
}

interface Coordinate {
    latitude: number;
    longitude: number;
}

export class MultiKeypathModel extends JSONSerializable {
    /**
     * This property is associated with the "latitude" and "longitude" keys in JSON.
     */
    location: Coordinate;

    /**
     * This property is associated with the "nested.latitude" and "nested.longitude"
     * keys in JSON.
     */
    nestedLocation: Coordinate;

    static JSONKeyPathsByPropertyKey() {
        return {
            "location": ["latitude", "longitude"],
            "nestedLocation": ["nested.latitude", "nested.longitude"]
        };
    }

    static locationJSONTransformer(): ValueTransformer {
        return ValueTransformer.usingForwardAndReversibleBlocks(
            (value) => {
                return value;
            },
            (value: Coordinate) => {
                return value;
            }
        )
    }

    static nestedLocationJSONTransformer(): ValueTransformer {
        return ValueTransformer.usingForwardAndReversibleBlocks(
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

export class URLModel extends JSONSerializable {
    /**
     * Defaults to http://github.com.
     */
    url: URL;

    constructor() {
        super();

        this.url = new URL("http://github.com");
    }

    static JSONKeyPathsByPropertyKey() {
        return {
            "url": "url",
        };
    }

    static urlJSONTransformer(): ValueTransformer {
        return ValueTransformer.usingForwardAndReversibleBlocks(
            (value: string) => {
                return new URL(value);
            },
            (value: URL) => {
                if (value instanceof URL) {
                    return value.toString();
                }
                throw new Error("Invalid URL");
            }
        )
    }
}

/**
 * Parses MTLTestModel objects from JSON instead.
 */
export class SubstitutingTestModel extends JSONSerializable {
    static JSONKeyPathsByPropertyKey() {
        return {};
    }

    static classForParsingObject(json: any): ModelClass {
        if (json.username != null) {
            return TestModel;
        }
        return null;
    }
}

export class ClassClusterModel extends JSONSerializable {
    flavor: string;

    static JSONKeyPathsByPropertyKey() {
        return {
            "flavor": "flavor",
        };
    }

    static classForParsingObject(json: any): ModelClass {
        if (json.flavor === "chocolate") {
            return ChocolateClassClusterModel;
        }

        if (json.flavor === "strawberry") {
            return StrawberryClassClusterModel;
        }

        return undefined;
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

    static JSONKeyPathsByPropertyKey() {
        return Object.assign(super.JSONKeyPathsByPropertyKey(), {
            "bitterness": "chocolate_bitterness",
        });
    }

    static bitternessJSONTransformer(): ValueTransformer {
        return ValueTransformer.usingForwardAndReversibleBlocks(
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

    static JSONKeyPathsByPropertyKey() {
        return Object.assign(super.JSONKeyPathsByPropertyKey(), {
            "freshness": "strawberry_freshness",
        });
    }
}
