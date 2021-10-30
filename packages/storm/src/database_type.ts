import { ParmSql, SqlExpr } from "./sql_expr_type";


export interface Database {
    from<T extends object>(ctor: new () => T, alias?: string): SqlExpr<T>

    queryList<T>(sql: ParmSql): Promise<T[]>
    querySingle<T>(sql: ParmSql): Promise<T>

    insert<T>(item: T): void
    insert<T>(item: T, returnId: boolean): number
}