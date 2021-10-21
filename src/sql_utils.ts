import { assertArrowFunctionExpression, assertExpression, assertIdentifier, Expression, ExpressionKind, ExpressionNode, isBinaryExpression, isIdentifier, isNumericLiteral, isPropertyAccessExpression, isStringLiteral } from "tst-expression";
import { SqlExprContext, SqlTableJoin } from "./sql_expr";

export class SqlUtils {


    static convertWhere(context: SqlExprContext) {
        if (context.whereConditions.length == 0) return ""
        let whereStr = "where "
        context.whereConditions.forEach((expr, i) => {
            whereStr += SqlUtils.convertCondition(context, expr)
            if (i < context.whereConditions.length - 1)
                whereStr += " and "
        });
        return whereStr
    }


    /** 转换条件表达式为SQL语句部分 */
    static convertCondition(context: SqlExprContext, topExpr: Expression<any>, expression?: ExpressionNode) {
        assertExpression(topExpr)
        assertArrowFunctionExpression(topExpr.expression)

        const operatorMap: { [kind: number]: string } = {
            [ExpressionKind.BarBarToken]: "or",
            [ExpressionKind.AmpersandAmpersandToken]: "and",
            [ExpressionKind.EqualsEqualsEqualsToken]: "=",
            [ExpressionKind.EqualsEqualsToken]: "=",
            [ExpressionKind.ExclamationEqualsEqualsToken]: "!=",
            [ExpressionKind.ExclamationEqualsToken]: "!=",
            [ExpressionKind.GreaterThanEqualsToken]: ">=",
            [ExpressionKind.LessThanEqualsToken]: "<=",
            [ExpressionKind.GreaterThanToken]: ">",
            [ExpressionKind.LessThanToken]: "<",
        }

        if (expression == null) expression = topExpr.expression.body
        if (isBinaryExpression(expression))
            if (expression.operatorToken.kind == ExpressionKind.BarBarToken || expression.operatorToken.kind == ExpressionKind.AmpersandAmpersandToken)
                return `(${SqlUtils.convertCondition(context, topExpr, expression.left)} ${operatorMap[expression.operatorToken.kind]} ${this.convertCondition(context, topExpr, expression.right)})`
            else
                return `${SqlUtils.convertVal(context, topExpr, expression.left)} ${operatorMap[expression.operatorToken.kind]} ${SqlUtils.convertVal(context, topExpr, expression.right)}`
        else if (expression.kind == ExpressionKind.TrueKeyword) return "1==1";
        else if (expression.kind == ExpressionKind.FalseKeyword) return "1<>1";
    }

    /** 转换条件表达式左右两边的值为SQL语句 */
    static convertVal(context: SqlExprContext, topExpr: Expression<any>, expr: ExpressionNode) {

        if (isBinaryExpression(expr))
            SqlUtils.convertCondition(context, topExpr, expr)
        else if (isPropertyAccessExpression(expr)) {
            if (context.joins.length == 1)
                return expr.name.escapedText
            else {
                assertIdentifier(expr.expression)
                return `${expr.expression.escapedText}.${expr.name.escapedText}`
            }
        } else if (isIdentifier(expr)) {
            //访问变量
            return topExpr.context[expr.escapedText]
        }
        else if (isNumericLiteral(expr) || isStringLiteral(expr)) return expr.text
        else if (expr.kind == ExpressionKind.TrueKeyword) return "1"
        else if (expr.kind == ExpressionKind.FalseKeyword) return "0"
    }

    static convertTableName(join: SqlTableJoin) {
        if (join.Alias) {
            return `${join.Ctor.name} as ${join.Alias}`;
        } else {
            return `${join.Ctor.name}`;
        }
    }


    static convertJoin(context: SqlExprContext) {
        if (context.joins.length == 0) return ""
        let whereStr = ""
        context.joins.forEach((join, i) => {
            if (i > 0) {
                whereStr += `join ${SqlUtils.convertTableName(join)} on ${SqlUtils.convertCondition(context, join.ON)}`
                if (i < context.joins.length)
                    whereStr += "\r\n"
            }

        });
        return whereStr
    }
}