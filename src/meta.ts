import "reflect-metadata"

interface Meta {
    /** 表或列的别名 */
    Alias?: string
}
/** Table or column alias decorators */
export function alias(name: string) {
    return (target, propertyKey?: string, descriptor?: PropertyDescriptor) => {
        const meta = getMeta(target, propertyKey)
        meta.Alias = name
        if (propertyKey) {
            Reflect.defineMetadata('propertyMetaData', meta, target?.prototype ?? target, propertyKey);
        } else {
            Reflect.defineMetadata('classMetaData', meta, target);
        }

    }
}

/** Get Meta of Object */
export function getMeta(target: any, propertyKey?: string): Meta {

    if (propertyKey) {
        return Reflect.getMetadata('propertyMetaData', target?.prototype ?? target, propertyKey) ?? {}
    } else {
        return Reflect.getMetadata('classMetaData', target) ?? {}
    }

}

