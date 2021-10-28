import { Database, DefaultSqlExpr } from "storm";





export class SqliteSqlExpr<T> extends DefaultSqlExpr<T>{
    constructor(mianCtor: new () => T, database: Database, alias?: string) {
        super(mianCtor, database, alias);
    }
}