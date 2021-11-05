import { Database, DefaultSelectExpr } from "storm";
import { SqliteSqlBuilder } from "./sqlite_sql_builder";





export class SqliteSqlExpr<T> extends DefaultSelectExpr<T,SqliteSqlBuilder>{
    constructor(mianCtor: new () => T, database: Database, alias?: string) {
        super(mianCtor,SqliteSqlBuilder, database, alias);
    }
}