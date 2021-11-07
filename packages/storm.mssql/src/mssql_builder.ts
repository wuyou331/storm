import { SqlBuilder, SqlDialectChar, SqlExprContext } from "storm";



export class MsSqlBuilder extends SqlBuilder {
    constructor(sqlChar: SqlDialectChar, context?: SqlExprContext, params?: any[]) {
        super(sqlChar, context, params);
    }

    /** mssql版本必须先把参数push进数组，后调用本方法 */
    argPlaceholder() {
        const params = this.params
        return `@${params.length-1}`;
    }


    limit() {

        if (this.context.skip === undefined) return ""
        const limit = `offset ${this.context.skip} rows fetch next ${this.context.take} rows only`

        return limit.trim()
    }
}
