import { assertArrowFunctionExpression, assertExpression, Expression, ExpressionNode } from "tst-expression";
import { SqlExpr, SqlJoin2, SqlJoin3, SqlJoin4, SqlJoin5 } from "./sql_expr.type";
import { SqlUtils } from './sql_utils';


export class SqlTableJoin {
	constructor(public Ctor: { new(): any }, public Alias?: string, public ON?: Expression<any>) { }
}

export class SqlExprContext {
	/** where条件集合 */
	public whereConditions: Expression<any>[] = []
	/** join集合包含表和别名,第一个元素是from后面的主表 */
	public joins: SqlTableJoin[] = []
}

export class DefaultSqlExpr<T> implements SqlExpr<T>{

	constructor(mianCtor: { new(): T }, alias?: string) {
		this.context.joins.push(new SqlTableJoin(mianCtor, alias))
	}

	private context: SqlExprContext = new SqlExprContext()


	//方法签名需注意ctor2参数在接口中是必选的，但在实际的方法中是可选的
	Join<T1>(ctor2: { new(): T1 }): SqlJoin2<T, T, T1>
	Join<T1, T2>(ctor1: { new(): T1 }, ctor2?: { new(): T2 }): SqlJoin2<T, T1, T2>
	Join<T1, T2, T3>(ctor1: { new(): T1 }, ctor2?: { new(): T2 }, ctor3?: { new(): T3 }): SqlJoin3<T, T1, T2, T3>
	Join<T1, T2, T3, T4>(ctor1: { new(): T1 }, ctor2?: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }): SqlJoin4<T, T1, T2, T3, T4>
	Join<T1, T2, T3, T4, T5>(ctor1: { new(): T1 }, ctor2?: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }, ctor5?: { new(): T4 }): SqlJoin5<T, T1, T2, T3, T4, T5> {
		const On = (on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4, tab5?: T5) => boolean>): SqlExpr<T> => {
			assertExpression(on)
			assertArrowFunctionExpression(on.expression)
			let expr = on.expression
			var ctors: { new(): any }[] = [ctor1, ctor2, ctor3, ctor4, ctor5].filter(it => it != undefined)
			//join方法只有一个参数时，默认与主表连接
			if (ctors.length == 1)
				ctors = [this.context.joins[0].Ctor, ...ctors]
			let newCtor: { new(): any }
			let newAlias: string
			ctors.forEach((ctor, i) => {
				let alias = expr.parameters[i].name.escapedText
				if (ctor == this.context.joins[0].Ctor && this.context.joins[0].Alias == undefined)
					this.context.joins[0].Alias = alias

				//join方法可以同时多个表，需找出新表
				if (!this.context.joins.some(j => j.Ctor == ctor && j.Alias == alias)) {
					newCtor = ctor
					newAlias = alias
				}

			})
			if (newCtor == undefined)
				throw Error(`Join表达式有误，类型或别名与之前的Join冲突\r\nJoin(${ctors.map(c => c.name).join(',')}).ON(${on.compiled})`)

			this.context.joins.push(new SqlTableJoin(newCtor, newAlias, on))
			return this;
		}
		return { ON: On };
	}

	Where(predicate: Expression<(m: T) => boolean>): SqlExpr<T>
	Where<T1>(predicate: Expression<(m: T1) => boolean>): SqlExpr<T>
	Where<T1, T2>(predicate: Expression<(t1: T1, t2: T2) => boolean>): SqlExpr<T>
	Where<T1, T2, T3>(predicate: Expression<(t1: T1, t2: T2, t3: T3) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4, T5>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => boolean>): SqlExpr<T> {
		assertExpression(predicate)
		assertArrowFunctionExpression(predicate.expression)
		this.context.whereConditions.push(predicate)
		return this
	}



	ToSql() {
		return ["select * from ",
			SqlUtils.convertTableName(this.context.joins[0]),
			SqlUtils.convertJoin(this.context),
			SqlUtils.convertWhere(this.context)
		].join("")
	}
}

export const From = <T extends object>(ctor: { new(): T }, alias?: string): SqlExpr<T> => new DefaultSqlExpr<T>(ctor, alias)
