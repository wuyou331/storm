import { DefaultSqlExpr } from "../src/sql_expr_default";
import { SqlExpr } from "../src/sql_expr";

export class MockExpr<T> extends DefaultSqlExpr<T>  {

}

export const From = <T extends object>(ctor: new () => T, alias?: string): SqlExpr<T> => new MockExpr<T>(ctor, null, alias)
