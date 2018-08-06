export enum ErrorTypes {
    /**
     * classForParsingObject returned null for the given object.
     */
    JSONAdapterNoClassFound = "JSONAdapterNoClassFoundError",

    /**
     * The provided JSON is not valid.
     */
    JSONAdapterInvalidJSON = "JSONAdapterInvalidJSONError",

    /**
     * Used to indicate that the input valie was invalid.
     */
    TransformerHandlingInvalidInput = "TransformerHandlingInvalidInput",
}
