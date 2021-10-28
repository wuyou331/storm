import { ParmSql, SqlExpr } from "./sql_expr_type";


export interface Database {
    From<T extends object>(ctor: new () => T, alias?: string): SqlExpr<T>

    GetList<T>(sql: ParmSql): Promise<T[]>
}