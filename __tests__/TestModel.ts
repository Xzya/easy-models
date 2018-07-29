import { JSONSerializable } from "../lib";

export class TestModel extends JSONSerializable {
    name: string;
    nestedName: string;

    static JSONKeyPathsByPropertyKey() {
        return {
            "name": "username",
            "nestedName": "nested.name",
        };
    }

}
