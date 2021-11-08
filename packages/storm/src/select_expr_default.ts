import { assertArrowFunctionExpression, assertExpression, Expression, isStringLiteral, ParameterExpressionNode } from "tst-expression";
import { Database } from "./database";
import { SelectExpr, SqlJoin2, SqlJoin3, SqlJoin4, SqlJoin5, SqlJoin6, ParamSql } from "./select_expr";
import { SqlBuilder } from './sql_builder';


type JoinType = "Left" | "Right" | "Full" | "Inner" | ""

export class SqlTableJoin {
	constructor(public Ctor: new () => any, public Alias?: string, public ON?: Expression<any>, public JoinMethod?: JoinType) { }
}


/** SQL不同数据库的方言 */
export class SqlDialectChar {
	/** 字符格式的引号 */
	CharacterQuotes = "'"
	/** SQL参数占位符 */
	ParameterPlaceholder = "?"
}

export const _SQLCHAR = new SqlDialectChar()

/** 生成SQL语句所需的全部参数 */
export class SqlExprContext {
	/** where条件集合 */
	public whereConditions: Expression<any>[] = []

	/** 排序集合 */
	public orderby: { expr: Expression<any>, type: "asc" | "desc" }[] = []

	/** join集合包含表和别名,第一个元素是from后面的主表 */
	public joins: SqlTableJoin[] = []
	/** select 条件 */
	public select: undefined | string | Expression<any>

	public skip?: number

	public take?: number

}



/** 默认表达式抽象类 */
export abstract class DefaultSelectExpr<T, Tsb extends SqlBuilder> implements SelectExpr<T>{

	protected context: SqlExprContext
	protected database: Database

	constructor(mianCtor: new () => T, private sqlBuilder: new (sqlChar: SqlDialectChar, context?: SqlExprContext, params?: any[]) => Tsb, database: Database, alias?: string, sqlChar?: SqlDialectChar) {
		this.context = new SqlExprContext()
		this.context.joins.push(new SqlTableJoin(mianCtor, alias))
		this.database = database
	}
	orderBy(fields: Expression<(m: T) => any>): SelectExpr<T>
	orderBy<T1>(fields: Expression<(m: T1) => any>): SelectExpr<T> {
		this.context.orderby.push({ expr: fields, type: "asc" })
		return this
	}
	orderByDescending(fields: Expression<(m: T) => any>): SelectExpr<T>
	orderByDescending<T1>(fields: Expression<(m: T1) => any>): SelectExpr<T> {
		this.context.orderby.push({ expr: fields, type: "desc" })
		return this
	}



	// 方法签名需注意ctor2参数在接口中是必选的，但在实际的方法中是可选的
	// 因为TS语法限制，获取泛型对象需把构造函数传参进来，所以Join方法需要用圆括号传泛型参数而 Where用尖括号传泛型参数
	join<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	join<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	join<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	join<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	join<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	join<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this._join("", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}

	innerJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	innerJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	innerJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	innerJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	innerJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	innerJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this._join("Inner", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}

	leftJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	leftJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	leftJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	leftJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	leftJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	leftJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this._join("Left", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}

	rightJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	rightJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	rightJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	rightJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	rightJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	rightJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this._join("Right", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}


	fullJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	fullJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	fullJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	fullJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	fullJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	fullJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this._join("Full", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}


	private _join<T1, T2, T3, T4, T5, T6>(joinType: JoinType, ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		const fnON = (on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4, tab5?: T5, tab6?: T6) => boolean>): SelectExpr<T> => {
			assertExpression(on)
			assertArrowFunctionExpression(on.expression)
			const expr = on.expression

			let ctors: (new () => any)[] = [ctor1, ctor2, ctor3, ctor4, ctor5, ctor6].filter(it => it !== undefined)
			// join方法只有一个参数时，默认与主表连接
			if (ctors.length === 1) ctors = [this.context.joins[0].Ctor, ...ctors]

			let newCtor: new () => any
			let newAlias: string
			let newCtorNum: number = 0
			for (const i in ctors) {
				if (Object.prototype.hasOwnProperty.call(ctors, i)) {
					const ctor = ctors[i];
					const alias = expr.parameters[i].name.escapedText
					// 主表没有别名时，第一次关联时为主表增加别名
					if (ctor === this.context.joins[0].Ctor && this.context.joins[0].Alias === undefined)
						this.context.joins[0].Alias = alias

					// join方法可以同时多个表,但只能有一个表是本次关联新增的，如果有多个应该报错
					// 需找出新表并缓存
					if (!this.context.joins.some(j => j.Ctor === ctor && j.Alias === alias)) {
						newCtor = ctor
						newAlias = alias
						newCtorNum++
					}
					if (newCtorNum > 1)
						break;
				}
			}


			if (newCtorNum > 1)
				throw Error(`Join表达式有误，一次Join调用只能有一个新的表\r\nJoin(${ctors.map(c => c.name).join(',')}).ON(${on.compiled})`)
			else if (newCtorNum < 1)
				throw Error(`Join表达式有误，没有找到新的关联表\r\nJoin(${ctors.map(c => c.name).join(',')}).ON(${on.compiled})`)

			this.context.joins.push(new SqlTableJoin(newCtor, newAlias, on, joinType))
			return this;
		}
		return { on: fnON };
	}

	where(predicate: Expression<(m: T) => boolean>): SelectExpr<T>
	where<T1>(predicate: Expression<(m: T1) => boolean>): SelectExpr<T>
	where<T1, T2>(predicate: Expression<(t1: T1, t2: T2) => boolean>): SelectExpr<T>
	where<T1, T2, T3>(predicate: Expression<(t1: T1, t2: T2, t3: T3) => boolean>): SelectExpr<T>
	where<T1, T2, T3, T4>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => boolean>): SelectExpr<T>
	where<T1, T2, T3, T4, T5>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => boolean>): SelectExpr<T>
	where<T1, T2, T3, T4, T5, T6>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => boolean>): SelectExpr<T> {
		assertExpression(predicate)
		assertArrowFunctionExpression(predicate.expression)
		if (this.context.joins.length > 1) {
			let errParam: ParameterExpressionNode
			for (const param of predicate.expression.parameters) {
				const exists = this.context.joins.some(j => j.Alias === param.name.escapedText)
				if (!exists) {
					errParam = param
					break
				}
			}

			if (errParam) {
				throw Error(`Where表达式中，有不存在的别名:'${errParam.name.escapedText}'${SqlBuilder.NewLine}Where(${predicate.compiled})`)
			}
		}
		this.context.whereConditions.push(predicate)
		return this
	}

	select(fields?: string): SelectExpr<T>
	select<TReturn>(fields: Expression<(m: T) => TReturn> | string): SelectExpr<T> | SelectExpr<TReturn>
	select<T1, TReturn>(fields?: Expression<(m: T1) => TReturn> | string): SelectExpr<T> | SelectExpr<TReturn>
	select<T1, T2, TReturn>(fields?: Expression<(t1: T1, t2: T2) => TReturn> | string): SelectExpr<T> | SelectExpr<TReturn>
	select<T1, T2, T3, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3) => TReturn> | string): SelectExpr<T> | SelectExpr<TReturn>
	select<T1, T2, T3, T4, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => TReturn> | string): SelectExpr<T> | SelectExpr<TReturn>
	select<T1, T2, T3, T4, T5, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => TReturn> | string): SelectExpr<T> | SelectExpr<TReturn>
	select<T1, T2, T3, T4, T5, T6, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => TReturn> | string): SelectExpr<T> | SelectExpr<TReturn> {
		if (fields === undefined) {
			this.context.select = "*"
		}
		else if (typeof fields === "string") {
			this.context.select = fields
		}
		else {
			assertExpression(fields)
			if (isStringLiteral(fields.expression)) {
				this.context.select = fields.compiled
			} else {
				this.context.select = fields
			}
		}

		return this;
	}


	skip(n: number): SelectExpr<T> {
		this.context.skip = n
		return this;
	}
	take(n: number): SelectExpr<T> {
		if (!this.context.skip) this.skip(0)
		this.context.take = n
		return this;
	}





	toMergeSql(): string {
		const sql = new this.sqlBuilder(_SQLCHAR, this.context)
		return sql.selectSql() as string
	}

	toSql(parms?: any[]): ParamSql {
		const sql = new this.sqlBuilder(_SQLCHAR, this.context, parms === undefined ? [] : parms)
		return sql.selectSql() as ParamSql
	}

	queryList(): Promise<T[]>
	queryList<TModel>(): Promise<TModel[]> {
		const sql = this.toSql();
		return this.database.queryList(sql)
	}

	querySingle(): Promise<T>
	querySingle<TModel>(): Promise<TModel> {
		this.take(1)
		const sql = this.toSql();
		return this.database.querySingle(sql)
	}

}