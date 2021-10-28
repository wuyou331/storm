import { DefaultSqlExpr } from "../src/sql_expr";
import { SqlExpr } from "../src/sql_expr_type";

export class MockExpr<T> extends DefaultSqlExpr<T>  {

}

export const From = <T extends object>(ctor: new () => T, alias?: string): SqlExpr<T> => new MockExpr<T>(ctor, null, alias)
