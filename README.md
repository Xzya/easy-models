[![Build Status](https://travis-ci.org/Xzya/mantlejs.svg?branch=master)](https://travis-ci.org/Xzya/mantlejs)
[![codecov](https://codecov.io/gh/Xzya/mantlejs/branch/master/graph/badge.svg)](https://codecov.io/gh/Xzya/mantlejs)

# MantleJS

MantleJS makes it easy to write a simple model layer for your JavaScript application. Inspired by [Mantle for iOS](https://github.com/Mantle/Mantle).

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