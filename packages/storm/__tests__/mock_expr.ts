import { DefaultSelectExpr, SqlDialectChar, SqlExprContext, SqlTableJoin, _SQLCHAR } from "../src/select_expr_default";
import { SelectExpr } from "../src/select_expr";
import { SqlBuilder } from './../src/sql_builder';

export class MockExpr<T> extends DefaultSelectExpr<T, MockSqlBuilder>  {

}
export class MockSqlBuilder extends SqlBuilder {
    constructor(sqlChar: SqlDialectChar, context?: SqlExprContext, params?: any[]) {
        super(sqlChar, context, params);
    }

    argPlaceholder() {
        return '?'
    }
}


export const From = <T extends object>(ctor: new () => T, alias?: string): SelectExpr<T> => new MockExpr<T>(ctor, MockSqlBuilder, null, alias)

export const CreateBuilder = (merge?: true): SqlBuilder => new MockSqlBuilder(_SQLCHAR, undefined, merge ? [] : undefined)