[![Build Status](https://travis-ci.org/Xzya/easy-models.svg?branch=master)](https://travis-ci.org/Xzya/easy-models)
[![codecov](https://codecov.io/gh/Xzya/easy-models/branch/master/graph/badge.svg)](https://codecov.io/gh/Xzya/easy-models)

# Easy models

`easy-models` makes it easy to write a simple model layer for your JavaScript application. Inspired by [Mantle for iOS](https://github.com/Mantle/Mantle).

## Installation

```bash
npm install --save easy-models
```

## Documentation

You can find the API reference [here](https://xzya.github.io/easy-models/).

## Usage

Let's use the [GitHub API](http://developer.github.com/) for demonstration.

### The typical model object

This is how you would typically represent a [GitHub issue](https://developer.github.com/v3/issues/#get-a-single-issue):

```typescript
class GHIssue {
    public readonly url: string;
    public readonly htmlUrl: string;
    public readonly number: number;
    public readonly state: GHIssueState;
    public readonly reporterLogin: string;
    public readonly assignee: GHUser;
    public readonly assignees: GHUser[];
    public readonly updatedAt: Date;

    public title: string;
    public body: string;

    public retrievedAt: Date;

    constructor(json: any) {
        this.url = json.url;
        this.htmlUrl = json.html_url;
        this.number = json.number;

        if (json.state === "open") {
            this.state = GHIssueState.Open;
        } else if (json.state === "closed") {
            this.state = GHIssueState.Closed;
        }

        this.title = json.title;
        this.body = json.body;
        this.reporterLogin = json.user.login;
        this.updatedAt = new Date(json.updated_at);
        this.assignee = new GHUser(json.assignee);

        const assignees: GHUser[] = [];
        for (const assigneeJSON of json.assignees) {
            const assignee = new GHUser(assigneeJSON);
            assignees.push(assignee);
        }
        this.assignees = assignees;

        this.retrievedAt = new Date();
    }
}
```

### Same model by extending `Model`

This is how you would represent the same model object by extending `Model`:

```typescript
import { Model, KeyPaths, ValueTransformer } from "easy-models";

enum GHIssueState {
    Open = 0,
    Closed,
}

class GHIssue extends Model {
    readonly url: string;
    readonly htmlUrl: string;
    readonly number: number;
    readonly state: GHIssueState;
    readonly reporterLogin: string;
    readonly assignee: GHUser;
    readonly assignees: GHUser[];
    readonly updatedAt: Date;

    title: string;
    body: string;

    retrievedAt: Date;

    constructor() {
        super();

        this.retrievedAt = new Date();
    }

    static JSONKeyPaths(): KeyPaths<GHIssue> {
        return {
            url: "url",
            htmlUrl: "html_url",
            number: "number",
            state: "state",
            reporterLogin: "user.login",
            assignee: "assignee",
            assignees: "assignees",
            updatedAt: "updated_at",
            title: "title",
            body: "body",
        };
    }

    static updatedAtJSONTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value: string) => {
                return new Date(value);
            },
            (value: Date) => {
                return value.toISOString();
            }
        );
    }

    static stateJSONTransformer(): ValueTransformer {
        return ValueTransformer.valueMappingTransformer({
            "open": GHIssueState.Open,
            "closed": GHIssueState.Closed,
        });
    }

    static assigneeJSONTransformer(): ValueTransformer {
        return ValueTransformer.objectTransformer(GHUser);
    }

    static assigneesJSONTransformer(): ValueTransformer {
        return ValueTransformer.arrayTransformer(GHUser);
    }
}
```

### Advantages of using `Model` over the typical aproach

- Turn a model *back* into JSON.

You can define the key mapping between your model and the JSON using the `JSONKeyPaths` method.

By default, turning a model back into JSON will map the values into the original keys. If your data needs transformation, you can define custom reversible transformers for each field, which will be used when turning the data to/from JSON (as seen for the `updatedAt` field above).

- Update a model with new data from the server.

`Model` has an extensible `mergeValues` method, which makes it easy to specify how new model data should be integrated.

- Validate models.

`Model` allows you to define validation methods for each field, which will be automatically called when you deserialize a model.

## Serializable

In order to serialize your model objects from or into JSON, you need to extend `Serializable` in your model class.

While extending `Model` is not required, it gives you some helper functions, which makes it a bit easier to work with.

Here is an example for the difference between using a model extending `Serializable` and `Model`:

```typescript
// extending Serializable
const model = ModelFromObject<MyModel>(jsonObject, MyModel);

// extending Model
const model = MyModel.from(jsonObject);
```

### `static JSONKeyPaths()`

The object returned by this method specifies how your model's properties map to the keys in the JSON representation, for example:

```typescript
class User extends Model {
    name: string;
    createdAt: Date;

    retrievedAt: Date;
    isAdmin: boolean;

    constructor() {
        super();

        this.retrievedAt = new Date();
    }

    static JSONKeyPaths(): KeyPaths<User> {
        return {
            createdAt: "created_at",
            name: "name",
        };
    }
}
```

In this example, the `User` class declares four properties that are handled in different ways:

- `name` is mapped to a key of the same name in the JSON representation.
- `createdAt` is converted to it's snake case equivalent.
- `isAdmin` is not serialized into JSON.
- `retrievedAt` is initialized when the object is being deserialized.

**Note**: Adding `KeyPaths<User>` return type annotation is not required, however, it will give you autocomplete for the object's property names, and the keys will also be renamed if you rename the property names.

JSON keys that don't have an explicit mapping are ignored:

```typescript
const json = {
    "name": "John Doe",
    "created_at": "2018-08-05T16:28:28.966Z",
    "age": 26
};

const model = User.from(json);
```

Here, the `age` would be ignored since it is not mapped in `JSONKeyPaths`.

### `static JSONTransformerForKey`

Implement this optional method to convert a property from a different type when deserializing from JSON.

```typescript
class User {
    ...
    static JSONTransformerForKey(key: string): ValueTransformer {
        if (key === "createdAt") {
            return ValueTransformer.forwardAndReversible(
                (value: string) => {
                    return new Date(value);
                },
                (value: Date) => {
                    return value.toISOString();
                }
            );
        }
        return null;
    }
}
```

`key` is the key that applies to your model object, not the original JSON key. Keep this in mind if you transform the key names using `JSONTransformerForKey`.

For added convenience, if you implement `static <key>JSONTransformer`, the result of that method will be used instead:

```typescript
class User {
    ...
    static createdAtJSONTransformer(): ValueTransformer {
        return ValueTransformer.forwardAndReversible(
            (value: string) => {
                return new Date(value);
            },
            (value: Date) => {
                return value.toISOString();
            }
        );
    }
}
```

If the transformer is reversible, it will also be used when serializing the object back into JSON.

### `static classForParsingObject`

If you are implementing a class cluster, implement this optional method to determine which subclass of your base class should be used when deserializing an object from JSON.

```typescript
class Message extends Model {
    static classForParsingObject(value: any) {
        if (value.image_url != null) {
            return PictureMessage;
        }

        if (value.body != null) {
            return TextMessage;
        }

        throw new Error("No matching class for the JSON");
    }
}

class TextMessage extends Message {
    body: string;
}

class PictureMessage extends Message {
    imageUrl: string;
}
```

The class will then be picked based on the JSON you pass in:

```typescript
const textMessage = {
    "id": 1,
    "body": "Hello, world!"
};

const pictureMessage = {
    "id": 2,
    "image_url": "http://foo.com/cat.gif"
};

const invalidMessage = {
    "id": 3
};

try {
    const messageA = Message.from(textMessage) as TextMessage;
    const messageB = Message.from(pictureMessage) as PictureMessage;

    // throws error since no class is found
    const messageC = Message.from(invalidMessage);
} catch (err) {
    // handle error
}
```

## License

Open sourced under the [MIT license](./LICENSE.md).