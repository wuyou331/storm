import "reflect-metadata"

interface ClassMeta {
    /** 表或列的别名 */
    Alias?: string
}

interface FieldMeta {
    /** 表或列的别名 */
    Alias?: string
    SelectIgnore?: boolean
    InsertIgnore?: boolean
    UpdateIgnore?: boolean
}

/** Table or column alias decorators */
export function alias(name: string) {
    return (target, propertyKey?: string, descriptor?: PropertyDescriptor) => {

        if (propertyKey) {
            const meta = getMeta(target, propertyKey)
            meta.Alias = name
            Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
        } else {
            const meta = getMeta(target)
            meta.Alias = name
            Reflect.defineMetadata('classMetaData', meta, target);
        }

    }
}

export function ignore() {
    return (target, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const meta = getMeta(target, propertyKey)
        meta.SelectIgnore = true
        meta.InsertIgnore = true
        meta.UpdateIgnore = true
        Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
    }
}

export function selectIgnore() {
    return (target, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const meta = getMeta(target, propertyKey)
        meta.SelectIgnore = true
        Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
    }
}

export function insertIgnore() {
    return (target, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const meta = getMeta(target, propertyKey)
        meta.InsertIgnore = true
        Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
    }
}

export function updateIgnore() {
    return (target, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const meta = getMeta(target, propertyKey)
        meta.UpdateIgnore = true
        Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
    }
}

/** Get Meta of Object */
export function getMeta(target: any): ClassMeta
export function getMeta(target: any, propertyKey: string): FieldMeta
export function getMeta(target: any, propertyKey?: string): ClassMeta | FieldMeta {

    if (propertyKey) {
        return Reflect.getMetadata('fieldMetaData', target?.prototype ?? target, propertyKey) ?? {}
    } else {
        return Reflect.getMetadata('classMetaData', target) ?? {}
    }

}


