import { Database, DefaultSelectExpr } from "storm";
import { MsSqlBuilder } from "./mssql_builder";


export class MsSqlExpr<T> extends DefaultSelectExpr<T,MsSqlBuilder>{
    constructor(mianCtor: new () => T, database: Database, alias?: string) {
        super(mianCtor,MsSqlBuilder, database, alias);
    }

    
}