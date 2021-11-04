import { assertArrowFunctionExpression, assertExpression, Expression, isStringLiteral, ParameterExpressionNode } from "tst-expression";
import { Database } from "./database";
import { SqlExpr, SqlJoin2, SqlJoin3, SqlJoin4, SqlJoin5, SqlJoin6, ParamSql } from "./sql_expr";
import { SqlUtils } from './sql_utils';
import { _SQLCHAR } from 'storm';

type JoinType = "Left" | "Right" | "Full" | "Inner" | ""

export class SqlTableJoin {
	constructor(public Ctor: new () => any, public Alias?: string, public ON?: Expression<any>, public JoinMethod?: JoinType) { }
}


/** SQL不同数据库的方言 */
export class SqlDialectDialectChar {
	/** 字符格式的引号 */
	CharacterQuotes = "'"
	/** SQL参数占位符 */
	ParameterPlaceholder = "?"
}

const _SQLCHAR = new SqlDialectDialectChar()

/** 生成SQL语句所需的全部参数 */
export class SqlExprContext {
	/** where条件集合 */
	public whereConditions: Expression<any>[] = []
	/** join集合包含表和别名,第一个元素是from后面的主表 */
	public joins: SqlTableJoin[] = []
	/** select 条件 */
	public select: undefined | string | Expression<any>

	public skip?: number

	public take?: number

	constructor(public sqlChar: SqlDialectDialectChar) {

	}
}



/** 默认表达式抽象类 */
export abstract class DefaultSqlExpr<T> implements SqlExpr<T>{

	protected context: SqlExprContext
	protected database: Database
	constructor(mianCtor: new () => T, database: Database, alias?: string, sqlChar?: SqlDialectDialectChar) {
		this.context = new SqlExprContext(sqlChar ?? _SQLCHAR)
		this.context.joins.push(new SqlTableJoin(mianCtor, alias))
		this.database = database
	}



	// 方法签名需注意ctor2参数在接口中是必选的，但在实际的方法中是可选的
	// 因为TS语法限制，获取泛型对象需把构造函数传参进来，所以Join方法需要用圆括号传泛型参数而 Where用尖括号传泛型参数
	join<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	join<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	join<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	join<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	join<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	join<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.__join("", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}

	innerJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	innerJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	innerJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	innerJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	innerJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	innerJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.__join("Inner", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}

	leftJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	leftJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	leftJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	leftJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	leftJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	leftJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.__join("Left", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}

	rightJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	rightJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	rightJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	rightJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	rightJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	rightJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.__join("Right", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}


	fullJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	fullJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	fullJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	fullJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	fullJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	fullJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.__join("Full", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}


	private __join<T1, T2, T3, T4, T5, T6>(joinType: JoinType, ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		const fnON = (on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4, tab5?: T5, tab6?: T6) => boolean>): SqlExpr<T> => {
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

	where(predicate: Expression<(m: T) => boolean>): SqlExpr<T>
	where<T1>(predicate: Expression<(m: T1) => boolean>): SqlExpr<T>
	where<T1, T2>(predicate: Expression<(t1: T1, t2: T2) => boolean>): SqlExpr<T>
	where<T1, T2, T3>(predicate: Expression<(t1: T1, t2: T2, t3: T3) => boolean>): SqlExpr<T>
	where<T1, T2, T3, T4>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => boolean>): SqlExpr<T>
	where<T1, T2, T3, T4, T5>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => boolean>): SqlExpr<T>
	where<T1, T2, T3, T4, T5, T6>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => boolean>): SqlExpr<T> {
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
				throw Error(`Where表达式中，有不存在的别名:'${errParam.name.escapedText}'${SqlUtils.NewLine}Where(${predicate.compiled})`)
			}
		}
		this.context.whereConditions.push(predicate)
		return this
	}

	select(fields?: string): SqlExpr<T>
	select<TReturn>(fields: Expression<(m: T) => TReturn> | string): SqlExpr<T> | SqlExpr<TReturn>
	select<T1, TReturn>(fields?: Expression<(m: T1) => TReturn> | string): SqlExpr<T> | SqlExpr<TReturn>
	select<T1, T2, TReturn>(fields?: Expression<(t1: T1, t2: T2) => TReturn> | string): SqlExpr<T> | SqlExpr<TReturn>
	select<T1, T2, T3, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3) => TReturn> | string): SqlExpr<T> | SqlExpr<TReturn>
	select<T1, T2, T3, T4, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => TReturn> | string): SqlExpr<T> | SqlExpr<TReturn>
	select<T1, T2, T3, T4, T5, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => TReturn> | string): SqlExpr<T> | SqlExpr<TReturn>
	select<T1, T2, T3, T4, T5, T6, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => TReturn> | string): SqlExpr<T> | SqlExpr<TReturn> {
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


	skip(n: number): SqlExpr<T> {
		this.context.skip = n
		return this;
	}
	take(n: number): SqlExpr<T> {
		if (!this.context.skip) this.skip(0)
		this.context.take = n
		return this;
	}





	toMergeSql(): string {
		return [`select ${SqlUtils.select(this.context)} from ${SqlUtils.tableName(this.context.joins[0])}`,
		SqlUtils.join(this.context),
		SqlUtils.where(this.context),
		SqlUtils.limit(this.context),
		]
			.filter(s => s.length > 0)
			.join(SqlUtils.NewLine).trim()
	}

	toSql(parms?: any[]): ParamSql {
		const result = new ParamSql()
		if (parms !== undefined)
			result.params = parms
		result.sql = [`select ${SqlUtils.select(this.context, result.params)} from ${SqlUtils.tableName(this.context.joins[0])}`,
		SqlUtils.join(this.context),
		SqlUtils.where(this.context, result.params),
		SqlUtils.limit(this.context),
		]
			.filter(s => s.length > 0)
			.join(SqlUtils.NewLine)
			.trim()
		return result
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