import "reflect-metadata"

interface ClassMeta {
    /** 表或列的别名 */
    Alias?: string
    Members?: string[]
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
            const meta = Meta.getMeta(target, propertyKey)
            meta.Alias = name
            Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
        } else {
            const meta = Meta.getMeta(target)
            meta.Alias = name
            Reflect.defineMetadata('classMetaData', meta, target);
        }

    }
}

export function ignore() {
    return (target, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const meta = Meta.getMeta(target, propertyKey)
        meta.SelectIgnore = true
        meta.InsertIgnore = true
        meta.UpdateIgnore = true
        Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
    }
}

export function selectIgnore() {
    return (target, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const meta = Meta.getMeta(target, propertyKey)
        meta.SelectIgnore = true
        Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
    }
}

export function insertIgnore() {
    return (target, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const meta = Meta.getMeta(target, propertyKey)
        meta.InsertIgnore = true
        Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
    }
}

export function updateIgnore() {
    return (target, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const meta = Meta.getMeta(target, propertyKey)
        meta.UpdateIgnore = true
        Reflect.defineMetadata('fieldMetaData', meta, target?.prototype ?? target, propertyKey);
    }
}


export class Meta {
    /** Get Meta of Object */
    static getMeta(target: any): ClassMeta
    static getMeta(target: any, propertyKey: string): FieldMeta
    static getMeta(target: any, propertyKey?: string): ClassMeta | FieldMeta {

        if (propertyKey) {
            return Reflect.getMetadata('fieldMetaData', target?.prototype ?? target, propertyKey) ?? {}
        } else {
            return Reflect.getMetadata('classMetaData', target) ?? {}
        }

    }

    /** 获取类的成员 */
    static getMembers(ctor: new () => any): string[] {
        var meta = Meta.getMeta(ctor)
        if (!meta.Members) {
            meta.Members = Object.getOwnPropertyNames(new ctor())
        }
        return meta.Members
    }
}

