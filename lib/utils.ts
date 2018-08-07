/**
 * @hidden
 */
export function CreateError(msg: string, name: string): Error {
    const error = new Error(msg);
    error.name = name;

    return error;
}
