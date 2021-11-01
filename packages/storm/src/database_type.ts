import { Expression } from "tst-expression";
import { ParamSql, SqlExpr } from "./sql_expr_type";


export interface Database {
    from<T extends object>(ctor: new () => T, alias?: string): SqlExpr<T>

    queryList<T>(sql: ParamSql): Promise<T[]>
    querySingle<T>(sql: ParamSql): Promise<T>

    insert<T extends object>(item: T | Expression<() => T>): Promise<undefined>;
    insert<T extends object>(item: T | Expression<() => T>, returnId: boolean): Promise<number>;
    insert<T extends object>(item: T | Expression<() => T>, returnId?: boolean): Promise<number> | Promise<undefined> 
}