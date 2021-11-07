import { SqlBuilder, SqlDialectChar, SqlExprContext, _SQLCHAR } from "storm";

export class SqliteSqlBuilder extends SqlBuilder {
    constructor(sqlChar: SqlDialectChar, context?: SqlExprContext, params?: any[]) {
        super(sqlChar, context, params);
    }


}