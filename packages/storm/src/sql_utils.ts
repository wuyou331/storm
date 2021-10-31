import { assertArrowFunctionExpression, assertExpression, assertIdentifier, assertParameterExpression, assertPropertyAccessExpression, Expression, ExpressionKind, ExpressionNode, IdentifierExpressionNode, isBinaryExpression, isIdentifier, isNumericLiteral, isObjectLiteralExpression, isParenthesizedExpression, isPropertyAccessExpression, isPropertyAssignmentExpression, isShorthandPropertyAssignmentExpression, isStringLiteral } from "tst-expression";
import { isNumber } from "util";
import { Meta } from "./meta";
import { SqlExprContext, SqlTableJoin } from "./sql_expr";
import { ParmSql } from "./sql_expr_type";
import { updateIgnore } from 'storm';

export class SqlUtils {

    static readonly NewLine = "\r\n"

    /** select语句的join部分 */
    static join(context: SqlExprContext) {
        if (context.joins.length === 0) return ""
        let whereStr = ""
        context.joins.forEach((join, i) => {
            if (i > 0) {
                whereStr += `${join.JoinMethod.toLowerCase()} join ${SqlUtils.tableName(join)} on ${SqlUtils.convertCondition(context, join.ON)}`.trim()
                if (i < context.joins.length - 1)
                    whereStr += SqlUtils.NewLine
            }

        });
        return whereStr.trim()
    }

    /** select语句的limit部分 */
    static limit(context: SqlExprContext) {
        if (context.skip === undefined) return ""
        let limit = `limit ${context.skip}`
        if (context.take !== undefined) {
            limit += `,${context.take}`
        }
        return limit.trim()
    }
    /** select语句的where部分
     * @parms  参数化sql语句中参数部分
    */
    static where(context: SqlExprContext, parms?: any[]) {
        if (context.whereConditions.length === 0) return ""
        let whereStr = "where "
        context.whereConditions.forEach((expr, i) => {
            whereStr += SqlUtils.convertCondition(context, expr, undefined, parms = parms)
            if (i < context.whereConditions.length - 1)
                whereStr += " and "
        });
        return whereStr.trim()
    }

    /** 条件表达式中的操作符集合 */
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
    static convertCondition(context: SqlExprContext, topExpr: Expression<any>, partExpr?: ExpressionNode, parms?: any[]) {
        assertExpression(topExpr)
        assertArrowFunctionExpression(topExpr.expression)
        if (partExpr == null) partExpr = topExpr.expression.body
        if (isBinaryExpression(partExpr))
            if (partExpr.operatorToken.kind === ExpressionKind.BarBarToken || partExpr.operatorToken.kind === ExpressionKind.AmpersandAmpersandToken)
                return `(${SqlUtils.convertCondition(context, topExpr, partExpr.left, parms)} ${SqlUtils.operatorMap[partExpr.operatorToken.kind]} ${this.convertCondition(context, topExpr, partExpr.right, parms)})`
            else
                return `${SqlUtils.convertVal(context, topExpr, partExpr.left, parms)} ${SqlUtils.operatorMap[partExpr.operatorToken.kind]} ${SqlUtils.convertVal(context, topExpr, partExpr.right, parms)}`
        else if (partExpr.kind === ExpressionKind.TrueKeyword) return "1==1";
        else if (partExpr.kind === ExpressionKind.FalseKeyword) return "1<>1";
    }

    /** 转换表达式的值 */
    static convertVal(context: SqlExprContext, topExpr: Expression<any>, expr: ExpressionNode, parms?: any[]) {

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
                return SqlUtils.propertyAccessByVar(context, topExpr, expr)
            }
        } else if (isIdentifier(expr)) {
            // lambda中直接访问变量
            if (parms === undefined)
                return topExpr.context[expr.escapedText]
            else {
                parms.push(topExpr.context[expr.escapedText])
                return "?"
            }
        }
        else if (isNumericLiteral(expr)) {
            if (parms === undefined)
                return expr.text
            else {
                parms.push(Number(expr.text))
                return "?"
            }
        }
        else if (isStringLiteral(expr)) {
            if (parms === undefined)
                return `${context.sqlChar.CharacterQuotes}${expr.text}${context.sqlChar.CharacterQuotes}`
            else {
                parms.push(expr.text)
                return "?"
            }
        }
        else if (expr.kind === ExpressionKind.TrueKeyword) return "1"
        else if (expr.kind === ExpressionKind.FalseKeyword) return "0"
    }

    /** 转换lambda参数的属性访问 */
    private static convertPropertyAccessByArgs(context: SqlExprContext, topExpr: Expression<any>, expr: ExpressionNode) {

        assertPropertyAccessExpression(expr)
        assertIdentifier(expr.expression)
        const properAlias = SqlUtils.getFieldAlias(context, expr.expression.escapedText, expr.name.escapedText)
        if (context.joins.length === 1)
            return properAlias
        else {

            return `${expr.expression.escapedText}.${properAlias}`
        }
    }

    /** 获取类属性别名 */
    private static getFieldAlias(context: SqlExprContext, classAlias: string, propertyName: string) {


        let ctor = context.joins.length === 1 ? context.joins[0].Ctor : undefined
        if (!ctor) {
            const i = context.joins.findIndex(j => j.Alias === classAlias)
            if (i === -1)
                throw Error(`未找到别名为${classAlias}的表`)
            ctor = context.joins[i].Ctor
        }
        return SqlUtils.getFieldAliasBtCtor(ctor, propertyName)
    }

    /** 获取类属性别名 */
    private static getFieldAliasBtCtor(ctor: new () => any, propertyName: string) {
        const meta = Meta.getMeta(ctor, propertyName)
        return meta?.Alias ?? propertyName
    }

    /** 判断列是否在Select中被忽略 */
    private static isSelectIgnore(ctor: new () => any, classAlias: string, propertyName: string): boolean {
        const meta = Meta.getMeta(ctor, propertyName)
        return meta.SelectIgnore
    }


    /** 转换调用变量的属性访问,支持多级变量访问支持 */
    private static propertyAccessByVar(context: SqlExprContext, topExpr: Expression<any>, expr: ExpressionNode) {

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

    /** 转换表名，用于select sql语句 */
    static tableName(join: SqlTableJoin) {
        const name = SqlUtils.tableNameByCtor(join.Ctor)
        if (join.Alias) {
            return `${name} as ${join.Alias}`;
        } else {
            return `${name}`;
        }
    }

    /** 获取表名，自动判断别名 */
    static tableNameByCtor(ctor: new () => any) {
        const meta = Meta.getMeta(ctor)
        const name = meta?.Alias ?? ctor.name
        return name
    }

    /** 转换sql语句 select 部分
     * @parms 参数非null表示用参数化的方式输出sql语句且parms为参数数组
     */
    static select(context: SqlExprContext, parms?: any[]) {
        const select = context.select
        if (select === undefined) {
            return "*"
        } else if (typeof select === "string") {
            return select.trim()
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
                const selectStr = []
                for (const prop of expr.properties) {
                    if (isShorthandPropertyAssignmentExpression(prop)) {
                        // eg: Select(i=>{i})
                        assertIdentifier(prop.name)
                        selectStr.push(SqlUtils.selectFieldByIdentifier(context, prop.name))
                    } else if (isPropertyAssignmentExpression(prop)) {
                        assertIdentifier(prop.name)
                        if (isPropertyAccessExpression(prop.initializer)) {
                            const left = SqlUtils.convertVal(context, select, prop.initializer, parms)
                            const right = prop.name.escapedText
                            if (left === right)
                                selectStr.push(right)
                            else
                                selectStr.push(`${left} as ${prop.name.escapedText}`)
                        }
                        else if (isStringLiteral(prop.initializer)) {
                            const left = SqlUtils.convertVal(context, select, prop.initializer, parms)
                            const right = prop.name.escapedText
                            if (left === right)
                                selectStr.push(right)
                            else
                                selectStr.push(`${left} as ${prop.name.escapedText}`)
                        }
                        else {
                            throw Error("Select方法中有不能识别的列" + prop.name.escapedText)
                        }


                    }
                }
                return selectStr.join(',').trim()

            } else if (isIdentifier(expr)) {
                // eg: Select(i=>i)
                return SqlUtils.selectFieldByIdentifier(context, expr).trim()
            } else {
                throw Error("Select方法中有不能识别的语法")
            }
        }

    }
    /** select中列出某个对象所有字段 eg: Select(i=>{i}) */
    private static selectFieldByIdentifier(context: SqlExprContext, expr: IdentifierExpressionNode) {
        const select = context.select
        const classAlias = expr.escapedText
        if (select.expression.parameters.some(p => p.name.escapedText === classAlias)) {
            const index = context.joins.findIndex(j => j.Alias === classAlias)
            let ctor: new () => any
            if (index === -1) {
                if (context.joins.length === 1) {
                    ctor = context.joins[0].Ctor
                } else {
                    throw Error(`Select方法有不能识别的别名'${classAlias}'`)
                }
            } else {
                ctor = context.joins[index].Ctor
            }

            const members = Meta.getMembers(ctor)

            if (context.joins.length === 1)
                return members
                    .filter(member => !SqlUtils.isSelectIgnore(ctor, classAlias, member))
                    .map(member => `${SqlUtils.getFieldAliasBtCtor(ctor, member)}`)
                    .join(',')
            else
                return members
                    .filter(member => !SqlUtils.isSelectIgnore(ctor, classAlias, member))
                    .map(member => `${classAlias}.${SqlUtils.getFieldAliasBtCtor(ctor, member)}`)
                    .join(",")
        }
    }


    //#region 
    /** 生成insert SQL语句 */
    static insert<T extends object>(item: T, merge?: false): string
    static insert<T extends object>(item: T, merge: true, lastIdSql?: string): ParmSql
    static insert<T extends object>(item: T, merge?: boolean, lastIdSql?: string): string | ParmSql {
        const ctor = item.constructor as new () => any
        if (ctor.name === "Object") throw new Error("insert方法只支持通过构造函数new出来的对象")
        const tableName = SqlUtils.tableNameByCtor(ctor)
        const columns = SqlUtils.insertColumns(ctor)

        if (merge) {
            const parms = []
            const values = SqlUtils.insertValues(ctor, item, parms)
            const sql = new ParmSql()
            sql.sql = `insert into ${tableName} (${columns}) values (${values})`
            sql.parms = parms
            if (lastIdSql)
                sql.sql += `;${this.NewLine}${lastIdSql}`
            return sql

        } else {
            let sql = `insert into ${tableName} (${columns}) values (${SqlUtils.insertValues(ctor, item)})`
            if (lastIdSql)
                sql += `;${this.NewLine}${lastIdSql}`
            return sql

        }
    }

    static insertColumns(ctor: new () => any) {
        const members = Meta.getMembers(ctor)
        let conlums = ""
        for (const member of members) {
            const meta = Meta.getMeta(ctor, member)
            if (!meta.InsertIgnore) {
                if (conlums.length > 0) conlums += ","
                const conlum = SqlUtils.getFieldAliasBtCtor(ctor, member)
                conlums += conlum
            }
        }
        return conlums
    }

    static insertValues<T>(ctor: new () => T, item: T, parms?: any[]) {
        const members = Meta.getMembers(ctor)
        let conlums = ""
        for (const member of members) {
            const meta = Meta.getMeta(ctor, member)
            if (!meta.InsertIgnore) {
                if (conlums.length > 0) conlums += ","
                const value = item[member]
                if (parms) {
                    conlums += "?"
                    parms.push(value ?? null)
                } else {
                    if (value === undefined)
                        conlums += "null"
                    else if (typeof value === 'number')
                        conlums += value
                    else {
                        conlums += `'${value}'`
                    }
                }

            }
        }
        return conlums
    }
    //#endregion


    static update<T>(item: T, where: (p: T) => boolean) {
        const ctor = item.constructor as new () => T
        if (ctor.name === "Object") throw new Error("update方法只支持通过构造函数new出来的对象")
        const tableName = SqlUtils.tableNameByCtor(ctor)
        const set = SqlUtils.updateAllColumns(ctor, item)
        //     const whereStr = SqlUtils.where(new SqlExprContext())
        let sql = `update ${tableName} set ${set}`

        return sql
    }

    static updateAllColumns<T>(ctor: new () => T, item: T) {
        const members = Meta.getMembers(ctor)
        let conlums = ""
        for (const member of members) {
            const meta = Meta.getMeta(ctor, member)
            if (!meta.UpdateIgnore) {
                if (conlums.length > 0) conlums += ","
                const conlum = SqlUtils.getFieldAliasBtCtor(ctor, member)
                const value = item[member]
                let valueStr = ""
                if (value === undefined)
                    valueStr = "null"
                else if (typeof value === 'number')
                    valueStr = `${value}`
                else
                    valueStr = `'${value}'`

                conlums += `${conlum} = ${valueStr}`
            }
        }
        return conlums
    }

    static updateFields<T>(fields: Expression<() => T>, where: (p: T) => boolean) {

    }
}