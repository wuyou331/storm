import { assertArrowFunctionExpression, assertExpression, assertObjectLiteralExpression, Expression, ExpressionNode, isIdentifier, isObjectLiteralExpression, isParenthesizedExpression, isStringLiteral, ParameterExpressionNode } from "tst-expression";
import { Database } from "./database_type";
import { SqlExpr, SqlJoin2, SqlJoin3, SqlJoin4, SqlJoin5, SqlJoin6, ParmSql } from "./sql_expr_type";
import { SqlUtils } from './sql_utils';

type JoinType = "Left" | "Right" | "Full" | "Inner" | ""
export class SqlTableJoin {
	constructor(public Ctor: new () => any, public Alias?: string, public ON?: Expression<any>, public JoinMethod?: JoinType) { }
}
export interface SqlChar {
	/** 字符格式的引号 */
	CharacterQuotes: string
	/** SQL参数占位符 */
	ParameterPlaceholder: string
}


export class SqlExprContext {
	/** where条件集合 */
	public whereConditions: Expression<any>[] = []
	/** join集合包含表和别名,第一个元素是from后面的主表 */
	public joins: SqlTableJoin[] = []
	/** select 条件 */
	public select: undefined | string | Expression<any>

	constructor(public sqlChar: SqlChar) {

	}
}


/** SQL不同数据库的方言 */
const _SQLCHAR: SqlChar = { CharacterQuotes: "'", ParameterPlaceholder: "?" }

/** 默认表达式抽象类 */
export abstract class DefaultSqlExpr<T> implements SqlExpr<T>{

	protected context: SqlExprContext = new SqlExprContext(_SQLCHAR)
	protected database: Database
	constructor(mianCtor: new () => T, database: Database, alias?: string) {
		this.context.joins.push(new SqlTableJoin(mianCtor, alias))
		this.database = database
	}



	// 方法签名需注意ctor2参数在接口中是必选的，但在实际的方法中是可选的
	// 因为TS语法限制，获取泛型对象需把构造函数传参进来，所以Join方法需要用圆括号传泛型参数而 Where用尖括号传泛型参数
	Join<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	Join<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	Join<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	Join<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	Join<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	Join<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.join("", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}

	InnerJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	InnerJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	InnerJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	InnerJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	InnerJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	InnerJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.join("Inner", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}

	LeftJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	LeftJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	LeftJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	LeftJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	LeftJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	LeftJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.join("Left", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}

	RightJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	RightJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	RightJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	RightJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	RightJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	RightJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.join("Right", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}


	FullJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	FullJoin<T1, T2>(ctor1: new () => T1, ctor2?: new () => T2): SqlJoin2<T, T1, T2>
	FullJoin<T1, T2, T3>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	FullJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	FullJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	FullJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
		return this.join("Full", ctor1, ctor2, ctor3, ctor4, ctor5, ctor6)
	}


	private join<T1, T2, T3, T4, T5, T6>(joinType: JoinType, ctor1: new () => T1, ctor2?: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6> {
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
		return { ON: fnON };
	}

	Where(predicate: Expression<(m: T) => boolean>): SqlExpr<T>
	Where<T1>(predicate: Expression<(m: T1) => boolean>): SqlExpr<T>
	Where<T1, T2>(predicate: Expression<(t1: T1, t2: T2) => boolean>): SqlExpr<T>
	Where<T1, T2, T3>(predicate: Expression<(t1: T1, t2: T2, t3: T3) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4, T5>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4, T5, T6>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => boolean>): SqlExpr<T> {
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


	Select(fields?: Expression<(m: T) => any> | string): SqlExpr<T>
	Select<T1>(fields?: Expression<(m: T1) => any> | string): SqlExpr<T>
	Select<T1, T2>(fields?: Expression<(t1: T1, t2: T2) => any> | string): SqlExpr<T>
	Select<T1, T2, T3>(fields?: Expression<(t1: T1, t2: T2, t3: T3) => any> | string): SqlExpr<T>
	Select<T1, T2, T3, T4>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => any> | string): SqlExpr<T>
	Select<T1, T2, T3, T4, T5>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => any> | string): SqlExpr<T>
	Select<T1, T2, T3, T4, T5, T6>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => any> | string): SqlExpr<T> {
		if (fields === undefined) {
			this.context.select = fields
		} else {
			assertExpression(fields)
			if (isStringLiteral(fields.expression)) {
				this.context.select = fields.compiled
			} else {
				this.context.select = fields
			}
		}

		return this
	}


	ToMergeSql(): string {
		return [`select ${SqlUtils.convertSelect(this.context)} from ${SqlUtils.convertTableName(this.context.joins[0])}`,
		SqlUtils.convertJoin(this.context),
		SqlUtils.convertWhere(this.context)
		]
			.filter(s => s.length > 0)
			.join(SqlUtils.NewLine).trim()
	}

	ToSql(): ParmSql {
		const result = new ParmSql()
		result.sql = [`select ${SqlUtils.convertSelect(this.context, result.parms)} from ${SqlUtils.convertTableName(this.context.joins[0])}`,
		SqlUtils.convertJoin(this.context),
		SqlUtils.convertWhere(this.context, result.parms)]
			.filter(s => s.length > 0)
			.join(SqlUtils.NewLine)
			.trim()
		return result
	}

	GetList(): Promise<T[]>
	GetList<TModel>(): Promise<TModel[]> {
		const sql = this.ToSql();
		return this.database.GetList(sql)
	}
}

