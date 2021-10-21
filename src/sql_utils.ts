import { assertArrowFunctionExpression, assertExpression, assertIdentifier, Expression, ExpressionKind, ExpressionNode, IdentifierExpressionNode, isBinaryExpression, isIdentifier, isNumericLiteral, isPropertyAccessExpression, isStringLiteral } from "tst-expression";
import { getMeta } from "./meta";
import { SqlExprContext, SqlTableJoin } from "./sql_expr";

export class SqlUtils {


    static convertJoin(context: SqlExprContext) {
        if (context.joins.length == 0) return ""
        let whereStr = ""
        context.joins.forEach((join, i) => {
            if (i > 0) {
                whereStr += `join ${SqlUtils.convertTableName(join)} on ${SqlUtils.convertCondition(context, join.ON)}`
                if (i < context.joins.length - 1)
                    whereStr += "\r\n"
            }

        });
        return whereStr
    }

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

    private static operatorMap: { [kind: number]: string } = {
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

    /** 转换条件表达式 Where 或者 Join */
    static convertCondition(context: SqlExprContext, topExpr: Expression<any>, partExpr?: ExpressionNode) {
        assertExpression(topExpr)
        assertArrowFunctionExpression(topExpr.expression)
        if (partExpr == null) partExpr = topExpr.expression.body
        if (isBinaryExpression(partExpr))
            if (partExpr.operatorToken.kind == ExpressionKind.BarBarToken || partExpr.operatorToken.kind == ExpressionKind.AmpersandAmpersandToken)
                return `(${SqlUtils.convertCondition(context, topExpr, partExpr.left)} ${SqlUtils.operatorMap[partExpr.operatorToken.kind]} ${this.convertCondition(context, topExpr, partExpr.right)})`
            else
                return `${SqlUtils.convertVal(context, topExpr, partExpr.left)} ${SqlUtils.operatorMap[partExpr.operatorToken.kind]} ${SqlUtils.convertVal(context, topExpr, partExpr.right)}`
        else if (partExpr.kind == ExpressionKind.TrueKeyword) return "1==1";
        else if (partExpr.kind == ExpressionKind.FalseKeyword) return "1<>1";
    }

    /** 转换条件表达式左右两边的值 */
    static convertVal(context: SqlExprContext, topExpr: Expression<any>, expr: ExpressionNode) {

        if (isBinaryExpression(expr))
            SqlUtils.convertCondition(context, topExpr, expr)
        else if (isPropertyAccessExpression(expr)) {
            //属性访问有两种， 1、调用lambda参数   2、调用变量
            assertExpression(topExpr)
            assertArrowFunctionExpression(topExpr.expression)
            if (isIdentifier(expr.expression) &&
                topExpr.expression.parameters.some(p => p.name.escapedText == (expr.expression as IdentifierExpressionNode).escapedText)) {
                //调用lambda参数
                if (context.joins.length == 1)
                    return expr.name.escapedText
                else {
                    let propName = expr.expression.escapedText
                    let i = context.joins.findIndex(j => j.Alias == propName)
                    if (i == -1)
                        throw Error(`未找到别名为${propName}的表`)
                    let ctor = context.joins[i].Ctor
                    let meta = getMeta(ctor, expr.name.escapedText)
                    propName = meta?.Alias ?? propName
                    return `${expr.expression.escapedText}.${propName}`
                }
            } else {
                //调用变量,多级变量访问支持
                let tmpExp = expr.expression
                let stack: string[] = []
                stack.push(expr.name.escapedText)
                while (isPropertyAccessExpression(tmpExp)) {
                    stack.push(tmpExp.name.escapedText)
                    tmpExp = tmpExp.expression
                }
                assertIdentifier(tmpExp)
                stack.push(tmpExp.escapedText)
                stack.reverse()

                let val = topExpr.context
                for (let i in stack)
                    val = val[stack[i]]
                return val
            }
        } else if (isIdentifier(expr)) {
            //lambda中直接访问变量
            return topExpr.context[expr.escapedText]
        }
        else if (isNumericLiteral(expr) || isStringLiteral(expr)) return expr.text
        else if (expr.kind == ExpressionKind.TrueKeyword) return "1"
        else if (expr.kind == ExpressionKind.FalseKeyword) return "0"
    }


    static convertTableName(join: SqlTableJoin) {
        let meta = getMeta(join.Ctor)
        let name = meta?.Alias ?? join.Ctor.name
        if (join.Alias) {
            return `${name} as ${join.Alias}`;
        } else {
            return `${name}`;
        }
    }



}