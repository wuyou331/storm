import { assertArrowFunctionExpression, assertExpression, assertIdentifier, assertParameterExpression, assertPropertyAccessExpression, Expression, ExpressionKind, ExpressionNode, IdentifierExpressionNode, isBinaryExpression, isIdentifier, isNumericLiteral, isObjectLiteralExpression, isParenthesizedExpression, isPropertyAccessExpression, isPropertyAssignmentExpression, isShorthandPropertyAssignmentExpression, isStringLiteral } from "tst-expression";
import { isFunction, isNumber } from "util";
import { Meta } from "./meta";
import { SqlExprContext, SqlTableJoin } from "./sql_expr";
import { ParamSql } from "./sql_expr_type";
import { updateIgnore, _SQLCHAR } from 'storm';
import { AsExpression, isAsExpression, assertAsExpression } from './tsexpr_type';

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
     * @param parms  参数化sql语句中参数部分
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


    //#region isnert语句
    /** 生成insert SQL语句
     *  @example
     *  SqlUtils.insert(blog)
     *  or
     *  SqlUtils.insert({ UserId: 1, Title: blog.Title } as Blog)
     */
    static insert<T extends object>(item: T | Expression<() => T>, merge?: boolean, lastIdSql?: string): string | ParamSql {
        return SqlUtils.insertExpr(item, merge, lastIdSql)
    }

    /**
     *  生成insert SQL语句
     * @param item Expression<() => T>声明为any是为了避免编译器多次转换表达式
     * @param merge 返回是否参数化的sql语句
     * @param lastIdSql 执行完insert后，返回id的sql语句
     */
    static insertExpr<T extends object>(item: any, merge?: boolean, lastIdSql?: string): string | ParamSql {
        assertExpression(item)
        let ctor: new () => T
        let obj: T
        if (isIdentifier(item.expression)) {
            obj = item.compiled as T;
            ctor = obj.constructor as new () => T
        }
        else if (isAsExpression(item.expression)) {
            ctor = item.context[item.expression.type.typeName.escapedText]
            obj = item.compiled as T
        } else {
            throw new Error("不支持的调用方式")
        }


        const fields = Meta.getMembers(ctor)
        const tableName = SqlUtils.tableNameByCtor(ctor)
        const columns = SqlUtils.insertColumns(ctor, fields)

        if (merge) {
            const parms = []
            const values = SqlUtils.insertValues(ctor, obj, fields, parms)
            const sql = new ParamSql()
            sql.sql = `insert into ${tableName} (${columns}) values (${values})`
            sql.params = parms
            if (lastIdSql)
                sql.sql += `;${this.NewLine}${lastIdSql}`
            return sql

        } else {
            let sql = `insert into ${tableName} (${columns}) values (${SqlUtils.insertValues(ctor, obj, fields)})`
            if (lastIdSql)
                sql += `;${this.NewLine}${lastIdSql}`
            return sql

        }
    }

    static insertColumns(ctor: new () => any, fields: string[]) {
        let conlums = ""
        for (const field of fields) {
            const meta = Meta.getMeta(ctor, field)
            if (!meta.InsertIgnore) {
                if (conlums.length > 0) conlums += ","
                const conlum = SqlUtils.getFieldAliasBtCtor(ctor, field)
                conlums += conlum
            }
        }
        return conlums
    }

    static insertValues<T>(ctor: new () => T, item: T, fields: string[], parms?: any[]) {
        let conlums = ""
        for (const field of fields) {
            const meta = Meta.getMeta(ctor, field)
            if (!meta.InsertIgnore) {
                if (conlums.length > 0) conlums += ","
                const value = item[field]
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

    //#region update语句
    /**
     * 生成update语句，会更新所有字段
     * @returns 返回完整的update语句
     * @example
     * SqlUtils.updateAll(blog, b => b.Id === 1)
     */
    static update<T extends object>(item: T, where: Expression<(p: T) => boolean>, merge?: boolean): string | ParamSql {
        const ctor = this.getCtorByNewObject(item)
        if (merge) {
            return this.updateSql(ctor, item, Meta.getMembers(ctor), where, merge)
        } else {
            return this.updateSql(ctor, item, Meta.getMembers(ctor), where)
        }
    }


    /**
     * 生成update语句，会权标更新所有字段
     * @returns 返回完整的update语句
     * @example
     * SqlUtils.updateAll(blog)
     */
    static updateAll<T extends object>(item: T, merge?: boolean): string | ParamSql {
        const ctor = this.getCtorByNewObject(item)
        if (merge) {
            return this.updateSql(ctor, item, Meta.getMembers(ctor), null, merge)
        } else {
            return this.updateSql(ctor, item, Meta.getMembers(ctor))
        }
    }

    /** 获取对象的构造方法，只能是new出来的对象 */
    private static getCtorByNewObject<T extends object>(item: T): new () => T {
        const ctor = item.constructor as new () => T
        if (ctor.name === "Object") throw new Error("只支持通过构造函数new出来的对象")
        return ctor;
    }


    /**
     * 生成update语句，只更新部分字段
     * @param fields 对象字段
     * @param where 更新条件
     * @example
     * SqlUtils.updateFields({ Title: "abc" } as Blog, b => b.Id === 1)
     */
    static updateFields<T extends object>(fields: Expression<T>, where: Expression<(p: T) => boolean>, merge?: boolean) {
        return SqlUtils.updateFieldsExpr(fields, where, merge)
    }

    static updateFieldsExpr<T extends object>(fields: any, where: Expression<(p: T) => boolean>, merge?: boolean) {
        assertExpression(fields)
        assertAsExpression(fields.expression)
        const { ctor, obj } = this.getCtorByExpr(fields)
        if (merge) {
            return this.updateSql(ctor, obj, Object.keys(obj), where, merge)
        } else {
            return this.updateSql(ctor, obj, Object.keys(obj), where)
        }
    }

    /**
     * 生成update语句，只更新部分列，并且没有where条件，全表更新
     * @param fields 需更新的列
     * @example
     * SqlUtils.updateFields({ Title: "abc" } as Blog)
     */
    static updateFieldsForAll<T extends object>(fields: Expression<T>, merge?: boolean) {
        return SqlUtils.updateFieldsForAllExpr(fields, merge)
    }

    static updateFieldsForAllExpr(fields: any, merge?: boolean) {
        assertExpression(fields)
        assertAsExpression(fields.expression)
        const { ctor, obj } = this.getCtorByExpr(fields)
        if (merge) {
            return this.updateSql(ctor, obj, Object.keys(obj), null, merge)
        } else {
            return this.updateSql(ctor, obj, Object.keys(obj))
        }

    }

    /** 从表达式中获取构造函数和对象
     * @param item any类型是因为如果用表达式树类型会被编译器再次转义
     * @example
     * SqlUtils.updateFieldsForAll({ Title: "abc" } as Blog)
     */
    private static getCtorByExpr(item: any) {
        assertExpression(item)
        let ctor: new () => any
        let obj: any
        if (isIdentifier(item.expression)) {
            obj = item.compiled as any;
            ctor = obj.constructor as new () => any
        }
        else if (isAsExpression(item.expression)) {
            ctor = item.context[item.expression.type.typeName.escapedText]
            obj = item.compiled as any
        } else {
            throw new Error("不支持的调用方式")
        }
        return { ctor, obj }
    }


    /** 生成update SQL语句的方法
     * @param where any类型是因为如果用表达式树类型会被编译器再次转义
     */
    private static updateSql<T extends object>(ctor: new () => T, obj: T, members: string[], where?: any, merge?: boolean): string | ParamSql {

        let whereStr = ""
        let sets = ""
        const parms: [] = []
        if (merge) {
            sets = SqlUtils.updateSet(ctor, obj, members, parms)
        } else {
            sets = SqlUtils.updateSet(ctor, obj, members)
        }

        if (where) {
            assertExpression(where)
            const context = new SqlExprContext(_SQLCHAR)
            const joinTable = new SqlTableJoin(ctor)
            context.joins.push(joinTable)
            context.whereConditions.push(where)
            if (merge) {
                whereStr = SqlUtils.where(context, parms)
            } else {
                whereStr = SqlUtils.where(context)
            }

        }
        const sql = [
            `update ${SqlUtils.tableNameByCtor(ctor)} set ${sets}`,
            `${whereStr}`]
            .filter(s => s.length > 0)
            .join(this.NewLine)

        return merge ? { sql, params: parms } as ParamSql : sql
    }

    /**
     * 生成更新语句的Set部分
     * @param ctor 对象构造方法
     * @param item 更新的对象
     * @param fields 需要出现的字段
     * @returns 返回set部分内容
     */
    static updateSet<T>(ctor: new () => T, item: T, fields: string[], parms?: any[]) {

        let conlums = ""
        for (const field of fields) {
            const meta = Meta.getMeta(ctor, field)
            if (!meta.UpdateIgnore) {
                if (conlums.length > 0) conlums += ","
                const conlum = SqlUtils.getFieldAliasBtCtor(ctor, field)
                const value = item[field]
                let valueStr = ""
                if (parms) {
                    valueStr = "?"
                    parms.push(value ?? null)
                } else {
                    if (value === undefined)
                        valueStr = "null"
                    else if (typeof value === 'number')
                        valueStr = `${value}`
                    else
                        valueStr = `'${value}'`
                }
                conlums += `${conlum} = ${valueStr}`
            }
        }
        return conlums
    }


    //#endregion

    //#region delete语句

    static delete<T extends object>(ctor: new () => T, where: Expression<(p: T) => boolean>, merge?: boolean): string | ParamSql {

        const params: [] = []
        let whereStr = ""
        if (where) {
            assertExpression(where)
            const context = new SqlExprContext(_SQLCHAR)
            const joinTable = new SqlTableJoin(ctor)
            context.joins.push(joinTable)
            context.whereConditions.push(where)
            if (merge) {
                whereStr = SqlUtils.where(context, params)
            } else {
                whereStr = SqlUtils.where(context)
            }

        }

        if (merge) {
            return {
                sql: [`delete from ${SqlUtils.tableNameByCtor(ctor)}`, whereStr]
                    .filter(s => s.length > 0)
                    .join(SqlUtils.NewLine), params
            } as ParamSql

        } else {

            return [`delete from ${SqlUtils.tableNameByCtor(ctor)}`, whereStr]
                .filter(s => s.length > 0)
                .join(SqlUtils.NewLine)

        }
    }

    //#endregion
}