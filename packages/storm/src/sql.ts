import { assertCallExpression, assertExpression, assertIdentifier, assertPropertyAccessExpression, Expression } from "tst-expression";
import { SqlExpr } from "./sql_expr_type";

export class Sql {
    static in<T>(field: any, subQuery: SqlExpr<T>|any[]) {
        return true
    }
    static notIn<T>(field: any, subQuery: SqlExpr<T>|any[]) {
        return true
    }
}


export class SqlCallCheck {
    static isSqlCall(expr: any): boolean {
        assertCallExpression(expr)
        assertPropertyAccessExpression(expr.expression)
        assertIdentifier(expr.expression.expression)
        return expr.expression.expression.escapedText == Sql.name
    }

    static in(expr: any): boolean {
        assertCallExpression(expr)
        assertPropertyAccessExpression(expr.expression)
        return SqlCallCheck.isSqlCall(expr) && (expr.expression.name.escapedText == Sql.in.name)
    }

    static notIn(expr: any): boolean {
        assertCallExpression(expr)
        assertPropertyAccessExpression(expr.expression)
        return SqlCallCheck.isSqlCall(expr) && (expr.expression.name.escapedText == Sql.notIn.name)
    }

}