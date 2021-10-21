

interface Meta {
    /** 表或列的别名 */
    Alias?: string
}
/** Table or column alias decorators*/
export function alias(name: string) {
    return function (target, methodName?: string, descriptor?: PropertyDescriptor) {
        let meta = getMeta(target, methodName);
        meta.Alias = name
    }
}

/** Get Meta of Object */
export function getMeta(target: any, methodName?: string): Meta {
    let meta: Meta
    if (!methodName)
        meta = target.prototype.$ClassMeta
    else {
        target = target?.prototype ?? target
        if (!target.$PropertyMeta) target.$PropertyMeta = {}
        meta = target.$PropertyMeta[methodName]
    }
    if (!meta) {
        meta = {}
        if (!methodName)
            target.prototype.$ClassMeta = meta
        else {
            target.$PropertyMeta[methodName] = meta
        }
    }
    return meta
}

