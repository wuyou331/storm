import { SqlBuilder, SqlDialectChar, SqlExprContext } from "storm";



export class MsSqlBuilder extends SqlBuilder {
    constructor(sqlChar: SqlDialectChar, context?: SqlExprContext, params?: any[]) {
        super(sqlChar, context, params);
    }

    argPlaceholder() {
        const parms = this.params
        return String(parms.length);
    }

}
