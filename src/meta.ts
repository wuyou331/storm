

interface Meta {
    Alias?: string
}
/** Table or column alias */
export function Alias(name: string) {
    return function (target) {
        let meta = getMeta(target);
        meta.Alias = name
    }
}

/** Get Meta of Object */
export function getMeta(o: any): Meta {
    let meta: Meta = o.prototype.$Meta
    if (!meta) {
        meta = {}
        o.prototype.$Meta = meta
    }
    return meta
}

