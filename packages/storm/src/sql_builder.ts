import { assertArrowFunctionExpression, assertExpression, assertIdentifier, assertPropertyAccessExpression, Expression, ExpressionKind, ExpressionNode, IdentifierExpressionNode, isBinaryExpression, isCallExpression, isIdentifier, isNumericLiteral, isObjectLiteralExpression, isParenthesizedExpression, isPropertyAccessExpression, isPropertyAssignmentExpression, isShorthandPropertyAssignmentExpression, isStringLiteral } from "tst-expression";
import { Meta } from "./meta";
import { SqlExprContext, SqlTableJoin, SqlDialectChar, _SQLCHAR } from "./select_expr_default";
import { isSqlExp, ParamSql } from "./select_expr";
import { isAsExpression, assertAsExpression, isArrayLiteralExpression } from './tsexpr_type';
import { SqlCallCheck } from "./sql";

export abstract class SqlBuilder {

    static readonly NewLine = "\r\n"

    /**
     * 
     * @param sqlChar 
     * @param context 如果是select必须传参，insert update delete无需传参，会自己生成
     * @param params 是否以参数化的方式输出SQL
     */
    constructor(private sqlChar: SqlDialectChar, protected context?: SqlExprContext, protected params?: any[]) {

    }



    /** 参数占位符  */
    abstract argPlaceholder(): string

    /** 判断是否需要参数化的方式输出sql */
    hasParams() {
        return !(this.params === undefined)
    }

    /** select语句的join部分 */
    join() {
        if (this.context.joins.length === 0) return ""
        let whereStr = ""
        this.context.joins.forEach((join, i) => {
            if (i > 0) {
                whereStr += `${join.JoinMethod.toLowerCase()} join ${this.tableName(join)} on ${this.condition(join.ON)}`.trim()
                if (i < this.context.joins.length - 1)
                    whereStr += SqlBuilder.NewLine
            }

        });
        return whereStr.trim()
    }

    /** select语句的limit部分 */
    limit() {
        if (this.context.skip === undefined) return ""
        let limit = `limit ${this.context.skip}`
        if (this.context.take !== undefined) {
            limit += `,${this.context.take}`
        }
        return limit.trim()
    }

    /** select语句的where部分
     */
    where() {
        if (this.context.whereConditions.length === 0) return ""
        let whereStr = "where "
        this.context.whereConditions.forEach((expr, i) => {
            whereStr += this.condition(expr, undefined)
            if (i < this.context.whereConditions.length - 1)
                whereStr += " and "
        });
        return whereStr.trim()
    }

    /** 条件表达式中的操作符集合 */
    private operatorMap: { [kind: number]: string } = {
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

    /** 转换条件表达式 Where 或者 Join on */
    condition(topExpr: Expression<any>, partExpr?: ExpressionNode,) {
        assertExpression(topExpr)
        assertArrowFunctionExpression(topExpr.expression)
        if (partExpr == null) partExpr = topExpr.expression.body

        if (isBinaryExpression(partExpr))
            if (partExpr.operatorToken.kind === ExpressionKind.BarBarToken || partExpr.operatorToken.kind === ExpressionKind.AmpersandAmpersandToken)
                return `(${this.condition(topExpr, partExpr.left)} ${this.operatorMap[partExpr.operatorToken.kind]} ${this.condition(topExpr, partExpr.right)})`
            else
                return `${this.convertVal(topExpr, partExpr.left)} ${this.operatorMap[partExpr.operatorToken.kind]} ${this.convertVal(topExpr, partExpr.right)}`
        else if (partExpr.kind === ExpressionKind.TrueKeyword) return "1==1";
        else if (partExpr.kind === ExpressionKind.FalseKeyword) return "1<>1";
        else if (isCallExpression(partExpr)) {
            if (SqlCallCheck.in(partExpr) || SqlCallCheck.notIn(partExpr)) {
                let left = this.convertVal(topExpr, partExpr.arguments[0])
                let right = this.convertVal(topExpr, partExpr.arguments[1])
                left = (left instanceof ParamSql) ? left.sql : left
                right = (right instanceof ParamSql) ? right.sql : right
                return `${left} ${SqlCallCheck.notIn(partExpr) ? "not " : ""}in (${right})`
            }
            return "abc"
        }
    }



    /** 转换表达式的值 */
    convertVal(topExpr: Expression<any>, expr: ExpressionNode,): string | ParamSql {

        if (isBinaryExpression(expr))
            this.condition(topExpr, expr)
        else if (isPropertyAccessExpression(expr)) {
            // 属性访问有两种， 1、调用lambda参数   2、调用变量
            assertExpression(topExpr)
            assertArrowFunctionExpression(topExpr.expression)
            if (isIdentifier(expr.expression) &&
                topExpr.expression.parameters.some(p => p.name.escapedText === (expr.expression as IdentifierExpressionNode).escapedText)) {
                // 调用lambda参数
                return this.propertyAccessByArgs(topExpr, expr)
            } else {
                // 调用变量
                return this.propertyAccessByVar(topExpr, expr)
            }
        } else if (isIdentifier(expr)) {
            // lambda中直接访问变量
            const val = topExpr.context[expr.escapedText]
            if (isSqlExp(val)) {
                if (this.hasParams()) {
                    return val.toSql(this.params).sql
                } else {
                    return val.toMergeSql()
                }
            } else if (val instanceof Array) {
                if (this.hasParams()) {
                    this.params.push(val)
                    return this.argPlaceholder()
                } else {
                    let arrStr = ""
                    for (const v of val) {
                        if (arrStr.length > 0) arrStr += ","
                        if (typeof (v) === "string") {
                            arrStr += `${this.sqlChar.CharacterQuotes}${v}${this.sqlChar.CharacterQuotes}`
                        } else if (typeof (v) === "number") {
                            arrStr += `${v}`
                        }
                    }
                    return arrStr;

                }
            } else {
                if (this.hasParams()) {
                    this.params.push(val)
                    return this.argPlaceholder()
                }
                else {
                    return val
                }
            }

        } else if (isArrayLiteralExpression(expr)) {
            let arrStr = ""
            for (const v of expr.elements) {
                if (arrStr.length > 0) arrStr += ","
                arrStr += `${this.convertVal(topExpr, v)}`
            }
            return arrStr;
        }
        else if (isNumericLiteral(expr)) {
            if (this.hasParams()) {
                this.params.push(Number(expr.text))
                return this.argPlaceholder()
            }
            else {
                return expr.text
            }
        }
        else if (isStringLiteral(expr)) {
            if (this.hasParams()) {
                this.params.push(expr.text)
                return this.argPlaceholder()
            }
            else {
                return `${this.sqlChar.CharacterQuotes}${expr.text}${this.sqlChar.CharacterQuotes}`
            }
        }
        else if (expr.kind === ExpressionKind.TrueKeyword) return "1"
        else if (expr.kind === ExpressionKind.FalseKeyword) return "0"
    }

    /** 转换lambda参数的属性访问 */
    propertyAccessByArgs(topExpr: Expression<any>, expr: ExpressionNode) {

        assertPropertyAccessExpression(expr)
        assertIdentifier(expr.expression)
        const properAlias = this.getFieldAlias(expr.expression.escapedText, expr.name.escapedText)
        if (this.context.joins.length === 1)
            return properAlias
        else {

            return `${expr.expression.escapedText}.${properAlias}`
        }
    }

    /** 获取类属性别名 */
    getFieldAlias(classAlias: string, propertyName: string) {


        let ctor = this.context.joins.length === 1 ? this.context.joins[0].Ctor : undefined
        if (!ctor) {
            const i = this.context.joins.findIndex(j => j.Alias === classAlias)
            if (i === -1)
                throw Error(`未找到别名为${classAlias}的表`)
            ctor = this.context.joins[i].Ctor
        }
        return this.getFieldAliasBtCtor(ctor, propertyName)
    }

    /** 获取类属性别名 */
    getFieldAliasBtCtor(ctor: new () => any, propertyName: string) {
        const meta = Meta.getMeta(ctor, propertyName)
        return meta?.Alias ?? propertyName
    }

    /** 判断列是否在Select中被忽略 */
    isSelectIgnore(ctor: new () => any, classAlias: string, propertyName: string): boolean {
        const meta = Meta.getMeta(ctor, propertyName)
        return meta.SelectIgnore
    }


    /** 转换调用变量的属性访问,支持多级变量访问支持 */
    propertyAccessByVar(topExpr: Expression<any>, expr: ExpressionNode) {

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
    tableName(join: SqlTableJoin) {
        const name = this.tableNameByCtor(join.Ctor)
        if (join.Alias) {
            return `${name} as ${join.Alias}`;
        } else {
            return `${name}`;
        }
    }

    /** 获取表名，自动判断别名 */
    tableNameByCtor(ctor: new () => any) {
        const meta = Meta.getMeta(ctor)
        const name = meta?.Alias ?? ctor.name
        return name
    }

    /** 转换sql语句 select 部分
     * @this.params 参数非null表示用参数化的方式输出sql语句且this.params为参数数组
     */
    select() {
        const select = this.context.select
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
                        selectStr.push(this.selectFieldByIdentifier(prop.name))
                    } else if (isPropertyAssignmentExpression(prop)) {
                        assertIdentifier(prop.name)
                        if (isPropertyAccessExpression(prop.initializer)) {
                            const left = this.convertVal(select, prop.initializer)
                            const right = prop.name.escapedText
                            if (left === right)
                                selectStr.push(right)
                            else
                                selectStr.push(`${left} as ${prop.name.escapedText}`)
                        }
                        else if (isStringLiteral(prop.initializer)) {
                            const left = this.convertVal(select, prop.initializer)
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
                return this.selectFieldByIdentifier(expr).trim()
            } else if (isPropertyAccessExpression(expr)) {
                // eg: Select(i=>i)
                return this.convertVal(select, expr)
            } else {
                throw Error("Select方法中有不能识别的语法")
            }
        }

    }


    /** select中列出某个对象所有字段 eg: Select(i=>{i}) */
    selectFieldByIdentifier(expr: IdentifierExpressionNode) {
        const select = this.context.select
        const classAlias = expr.escapedText
        if (select.expression.parameters.some(p => p.name.escapedText === classAlias)) {
            const index = this.context.joins.findIndex(j => j.Alias === classAlias)
            let ctor: new () => any
            if (index === -1) {
                if (this.context.joins.length === 1) {
                    ctor = this.context.joins[0].Ctor
                } else {
                    throw Error(`Select方法有不能识别的别名'${classAlias}'`)
                }
            } else {
                ctor = this.context.joins[index].Ctor
            }

            const members = Meta.getMembers(ctor)

            if (this.context.joins.length === 1)
                return members
                    .filter(member => !this.isSelectIgnore(ctor, classAlias, member))
                    .map(member => `${this.getFieldAliasBtCtor(ctor, member)}`)
                    .join(',')
            else
                return members
                    .filter(member => !this.isSelectIgnore(ctor, classAlias, member))
                    .map(member => `${classAlias}.${this.getFieldAliasBtCtor(ctor, member)}`)
                    .join(",")
        }
    }


    //#region  select语句


    selectSql(): ParamSql | string {
        const sql = [`select ${this.select()} from ${this.tableName(this.context.joins[0])}`,
        this.join(),
        this.where(),
        this.limit(),]
            .filter(s => s.length > 0)
            .join(SqlBuilder.NewLine).trim()

        if (this.hasParams()) {
            return { sql, params: this.params } as ParamSql
        } else {
            return sql
        }


    }
    //#endregion

    //#region isnert语句
    /** 生成insert SQL语句
     *  @example
     *  this.insert(blog)
     *  or
     *  this.insert({ UserId: 1, Title: blog.Title } as Blog)
     */
    insert<T extends object>(item: Expression<T>, lastIdSql?: string): string | ParamSql {
        return this.insertExpr(item, lastIdSql)
    }

    insertExpr<T extends object>(item: any, lastIdSql?: string): string | ParamSql {
        const { ctor, obj } = this.getCtorByExpr(item)
        return this.insertSql(obj, ctor, Meta.getMembers(ctor), lastIdSql)
    }


    /** 生成insert SQL语句 只包含部分列
     *  @example
     *  this.insert({ UserId: 1, Title: blog.Title } as Blog)
     */
    insertFields<T extends object>(item: Expression<T>, lastIdSql?: string): string | ParamSql {
        return this.insertFieldsExpr(item, lastIdSql)
    }

    insertFieldsExpr<T extends object>(item: any, lastIdSql?: string): string | ParamSql {
        assertExpression(item)
        assertAsExpression(item.expression)
        const { ctor, obj } = this.getCtorByExpr(item)
        return this.insertSql(obj, ctor, Object.keys(obj), lastIdSql)
    }


    /**
     *  生成insert SQL语句
     * @param item Expression<() => T>声明为any是为了避免编译器多次转换表达式
     * @param merge 返回是否参数化的sql语句
     * @param lastIdSql 执行完insert后，返回id的sql语句
     */
    insertSql<T extends object>(item: T, ctor: new () => T, fields: string[], lastIdSql?: string): string | ParamSql {

        const tableName = this.tableNameByCtor(ctor)
        const columns = this.insertColumns(ctor, fields)

        if (this.hasParams()) {
            const values = this.insertValues(ctor, item, fields)
            const sql = new ParamSql()
            sql.sql = `insert into ${tableName} (${columns}) values (${values})`
            sql.params = this.params
            if (lastIdSql)
                sql.sql += `;${SqlBuilder.NewLine}${lastIdSql}`
            return sql

        } else {
            let sql = `insert into ${tableName} (${columns}) values (${this.insertValues(ctor, item, fields)})`
            if (lastIdSql)
                sql += `;${SqlBuilder.NewLine}${lastIdSql}`
            return sql

        }
    }

    insertColumns(ctor: new () => any, fields: string[]) {
        let conlums = ""
        for (const field of fields) {
            const meta = Meta.getMeta(ctor, field)
            if (!meta.InsertIgnore) {
                if (conlums.length > 0) conlums += ","
                const conlum = this.getFieldAliasBtCtor(ctor, field)
                conlums += conlum
            }
        }
        return conlums
    }

    insertValues<T>(ctor: new () => T, item: T, fields: string[]) {
        let conlums = ""
        for (const field of fields) {
            const meta = Meta.getMeta(ctor, field)
            if (!meta.InsertIgnore) {
                if (conlums.length > 0) conlums += ","
                const value = item[field]
                if (this.hasParams()) {
                    conlums += this.argPlaceholder()
                    this.params.push(value ?? null)
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
     * this.updateAll(blog, b => b.Id === 1)
     */
    update<T extends object>(item: T, where: Expression<(p: T) => boolean>): string | ParamSql {
        const ctor = this.getCtorByNewObject(item)
        return this.updateSql(ctor, item, Meta.getMembers(ctor), where)
    }


    /**
     * 生成update语句，会权标更新所有字段
     * @returns 返回完整的update语句
     * @example
     * this.updateAll(blog)
     */
    updateAll<T extends object>(item: T): string | ParamSql {
        const ctor = this.getCtorByNewObject(item)
        return this.updateSql(ctor, item, Meta.getMembers(ctor))
    }

    /** 获取对象的构造方法，只能是new出来的对象 */
    getCtorByNewObject<T extends object>(item: T): new () => T {
        const ctor = item.constructor as new () => T
        if (ctor.name === "Object") throw new Error("只支持通过构造函数new出来的对象")
        return ctor;
    }


    /**
     * 生成update语句，只更新部分字段
     * @param fields 对象字段
     * @param where 更新条件
     * @example
     * this.updateFields({ Title: "abc" } as Blog, b => b.Id === 1)
     */
    updateFields<T extends object>(fields: Expression<T>, where: Expression<(p: T) => boolean>) {
        return this.updateFieldsExpr(fields, where)
    }

    updateFieldsExpr<T extends object>(fields: any, where: Expression<(p: T) => boolean>) {
        assertExpression(fields)
        assertAsExpression(fields.expression)
        const { ctor, obj } = this.getCtorByExpr(fields)
        return this.updateSql(ctor, obj, Object.keys(obj), where)
    }

    /**
     * 生成update语句，只更新部分列，并且没有where条件，全表更新
     * @param fields 需更新的列
     * @example
     * this.updateFields({ Title: "abc" } as Blog)
     */
    updateFieldsForAll<T extends object>(fields: Expression<T>) {
        return this.updateFieldsForAllExpr(fields)
    }

    updateFieldsForAllExpr(fields: any) {
        assertExpression(fields)
        assertAsExpression(fields.expression)
        const { ctor, obj } = this.getCtorByExpr(fields)
        return this.updateSql(ctor, obj, Object.keys(obj))
    }

    /** 从表达式中获取构造函数和对象
     * @param item any类型是因为如果用表达式树类型会被编译器再次转义
     * @example
     * this.updateFieldsForAll({ Title: "abc" } as Blog)
     */
    getCtorByExpr(item: any) {
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
    updateSql<T extends object>(ctor: new () => T, obj: T, members: string[], where?: any): string | ParamSql {

        let whereStr = ""
        let sets = ""
        sets = this.updateSet(ctor, obj, members)

        if (where) {
            assertExpression(where)
            this.createContext(ctor)
            this.context.whereConditions.push(where)
            whereStr = this.where()

        }
        const sql = [
            `update ${this.tableNameByCtor(ctor)} set ${sets}`,
            `${whereStr}`]
            .filter(s => s.length > 0)
            .join(SqlBuilder.NewLine)

        return this.hasParams() ? { sql, params: this.params } as ParamSql : sql
    }

    /**
     * 生成更新语句的Set部分
     * @param ctor 对象构造方法
     * @param item 更新的对象
     * @param fields 需要出现的字段
     * @returns 返回set部分内容
     */
    updateSet<T>(ctor: new () => T, item: T, fields: string[],) {

        let conlums = ""
        for (const field of fields) {
            const meta = Meta.getMeta(ctor, field)
            if (!meta.UpdateIgnore) {
                if (conlums.length > 0) conlums += ","
                const conlum = this.getFieldAliasBtCtor(ctor, field)
                const value = item[field]
                let valueStr = ""
                if (this.hasParams()) {
                    valueStr = this.argPlaceholder()
                    this.params.push(value ?? null)
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

    delete<T extends object>(ctor: new () => T, where: Expression<(p: T) => boolean>): string | ParamSql {
        return this.deleteExpr(ctor, where)
    }

    deleteExpr<T extends object>(ctor: new () => T, where: any): string | ParamSql {

        let whereStr = ""
        if (where) {
            assertExpression(where)
            this.createContext(ctor)
            this.context.whereConditions.push(where)
            whereStr = this.where()
        }

        if (this.hasParams()) {
            return {
                sql: [`delete from ${this.tableNameByCtor(ctor)}`, whereStr]
                    .filter(s => s.length > 0)
                    .join(SqlBuilder.NewLine), params: this.params
            } as ParamSql

        } else {

            return [`delete from ${this.tableNameByCtor(ctor)}`, whereStr]
                .filter(s => s.length > 0)
                .join(SqlBuilder.NewLine)

        }
    }

    //#endregion


    //#region static
    private createContext<T extends object>(ctor: new () => T) {
        if (this.context === undefined) {
            this.context = new SqlExprContext()
            const joinTable = new SqlTableJoin(ctor)
            this.context.joins.push(joinTable)
        }
    }
    //#endregion
}