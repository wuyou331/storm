import { assertArrowFunctionExpression, assertExpression, assertIdentifier, assertParameterExpression, assertPropertyAccessExpression, Expression, ExpressionKind, ExpressionNode, IdentifierExpressionNode, isBinaryExpression, isIdentifier, isNumericLiteral, isObjectLiteralExpression, isParenthesizedExpression, isPropertyAccessExpression, isPropertyAssignmentExpression, isShorthandPropertyAssignmentExpression, isStringLiteral } from "tst-expression";
import { getMeta } from "./meta";
import { SqlExprContext, SqlTableJoin } from "./sql_expr";

export class SqlUtils {


    static convertJoin(context: SqlExprContext) {
        if (context.joins.length === 0) return ""
        let whereStr = ""
        context.joins.forEach((join, i) => {
            if (i > 0) {
                whereStr += `${join.JoinMethod.toLowerCase()} join ${SqlUtils.convertTableName(join)} on ${SqlUtils.convertCondition(context, join.ON)}`.trim()
                if (i < context.joins.length - 1)
                    whereStr += "\r\n"
            }

        });
        return whereStr
    }

    static convertWhere(context: SqlExprContext) {
        if (context.whereConditions.length === 0) return ""
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
            if (partExpr.operatorToken.kind === ExpressionKind.BarBarToken || partExpr.operatorToken.kind === ExpressionKind.AmpersandAmpersandToken)
                return `(${SqlUtils.convertCondition(context, topExpr, partExpr.left)} ${SqlUtils.operatorMap[partExpr.operatorToken.kind]} ${this.convertCondition(context, topExpr, partExpr.right)})`
            else
                return `${SqlUtils.convertVal(context, topExpr, partExpr.left)} ${SqlUtils.operatorMap[partExpr.operatorToken.kind]} ${SqlUtils.convertVal(context, topExpr, partExpr.right)}`
        else if (partExpr.kind === ExpressionKind.TrueKeyword) return "1==1";
        else if (partExpr.kind === ExpressionKind.FalseKeyword) return "1<>1";
    }

    /** 转换条件表达式左右两边的值 */
    static convertVal(context: SqlExprContext, topExpr: Expression<any>, expr: ExpressionNode) {

        if (isBinaryExpression(expr))
            SqlUtils.convertCondition(context, topExpr, expr)
        else if (isPropertyAccessExpression(expr)) {
            // 属性访问有两种， 1、调用lambda参数   2、调用变量
            assertExpression(topExpr)
            assertArrowFunctionExpression(topExpr.expression)
            if (isIdentifier(expr.expression) &&
                topExpr.expression.parameters.some(p => p.name.escapedText === (expr.expression as IdentifierExpressionNode).escapedText)) {
                // 调用lambda参数
                return SqlUtils.convertPropertyAccessByArgs(context, topExpr, expr)
            } else {
                // 调用变量
                return SqlUtils.convertPropertyAccessByVar(context, topExpr, expr)
            }
        } else if (isIdentifier(expr)) {
            // lambda中直接访问变量
            return topExpr.context[expr.escapedText]
        }
        else if (isNumericLiteral(expr) || isStringLiteral(expr)) return expr.text
        else if (expr.kind === ExpressionKind.TrueKeyword) return "1"
        else if (expr.kind === ExpressionKind.FalseKeyword) return "0"
    }

    /** 转换lambda参数的属性访问 */
    private static convertPropertyAccessByArgs(context: SqlExprContext, topExpr: Expression<any>, expr: ExpressionNode) {

        assertPropertyAccessExpression(expr)
        assertIdentifier(expr.expression)

        if (context.joins.length === 1)
            return expr.name.escapedText
        else {
            const classAlias = expr.expression.escapedText
            const i = context.joins.findIndex(j => j.Alias === classAlias)
            if (i === -1)
                throw Error(`未找到别名为${classAlias}的表`)
            const ctor = context.joins[i].Ctor
            const propertyAlias = expr.name.escapedText
            const meta = getMeta(ctor, propertyAlias)
            return `${expr.expression.escapedText}.${meta?.Alias ?? propertyAlias}`
        }
    }
    /** 转换调用变量的属性访问,支持多级变量访问支持 */
    private static convertPropertyAccessByVar(context: SqlExprContext, topExpr: Expression<any>, expr: ExpressionNode) {

        assertPropertyAccessExpression(expr)
        //
        let tmpExp = expr.expression
        const stack: string[] = []
        stack.push(expr.name.escapedText)
        while (isPropertyAccessExpression(tmpExp)) {
            stack.push(tmpExp.name.escapedText)
            tmpExp = tmpExp.expression
        }
        assertIdentifier(tmpExp)
        stack.push(tmpExp.escapedText)
        stack.reverse()

        let val = topExpr.context
        for (const stackVal of stack)
            val = val[stackVal]
        return val
    }
    static convertTableName(join: SqlTableJoin) {
        const meta = getMeta(join.Ctor)
        const name = meta?.Alias ?? join.Ctor.name
        if (join.Alias) {
            return `${name} as ${join.Alias}`;
        } else {
            return `${name}`;
        }
    }

    static convertSelect(context: SqlExprContext) {
        const select = context.select
        if (select === undefined) {
            return "*"
        } else if (typeof select === "string") {
            return select
        } else {
            assertExpression(select)
            assertArrowFunctionExpression(select.expression)
            let expr: ExpressionNode = select.expression.body
            while (isParenthesizedExpression(expr)) {
                // 多重圆括号包裹
                expr = expr.expression
            }

            if (isObjectLiteralExpression(expr)) {
                // eg: Select(i=>{Id:id.Id})
                let selectStr = []
                for (const prop of expr.properties) {
                    if (isShorthandPropertyAssignmentExpression(prop)) {
                        assertIdentifier(prop.name)
                        selectStr.push(SqlUtils.convertSelectFieldByisIdentifier(context, prop.name))
                    } else if (isPropertyAssignmentExpression(prop)) {
                        assertIdentifier(prop.name)
                        assertPropertyAccessExpression(prop.initializer)
                        selectStr.push(`${SqlUtils.convertVal(context,select,prop.initializer)} as ${prop.name.escapedText}`)
                    }
                }
                return selectStr

            } else if (isIdentifier(expr)) {
                // eg: Select(i=>{i})
                return SqlUtils.convertSelectFieldByisIdentifier(context, expr)
            } else {
                throw Error("Select方法中有不能识别的语法")
            }
        }

    }

    private static convertSelectFieldByisIdentifier(context: SqlExprContext, expr: IdentifierExpressionNode) {
        const select = context.select
        const argName = expr.escapedText
        if (select.expression.parameters.some(p => p.name.escapedText === argName)) {
            const index = context.joins.findIndex(j => j.Alias === argName)
            if (index === -1) throw Error(`Select方法有不能识别的别名'${argName}'`)
            const ctor = context.joins[index].Ctor
            const members = Object.getOwnPropertyNames(new ctor())
            if (context.joins.length === 1)
                return members.join(',')
            else
                return members.map(m => `${argName}.${m}`).join(",")
        }
    }

}