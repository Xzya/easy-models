import get from "lodash.get";
import { JSONSerializable, ValueTransformer } from "../lib";

export class TestModel extends JSONSerializable {
    name: string;
    count: number;
    nestedName: string;

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
    location: Coordinate;
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
