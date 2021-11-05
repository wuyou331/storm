import exp = require("constants");
import { Expression } from "tst-expression";

export class ParamSql {
	public sql: string
	public params: any[] = []

}
export interface SelectExpr<T> {
	join<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	join<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	join<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	join<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	join<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	join<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin5<T, T1, T2, T3, T4, T5>

	innerJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	innerJoin<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	innerJoin<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	innerJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	innerJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	innerJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6>

	leftJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	leftJoin<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	leftJoin<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	leftJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	leftJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	leftJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6>

	rightJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	rightJoin<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	rightJoin<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	rightJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	rightJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	rightJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6>


	fullJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	fullJoin<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	fullJoin<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	fullJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	fullJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	fullJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6>


	where(predicate: Expression<(m: T) => boolean>): SelectExpr<T>
	where<T1>(predicate: Expression<(m: T1) => boolean>): SelectExpr<T>
	where<T1, T2>(predicate: Expression<(t1: T1, t2: T2) => boolean>): SelectExpr<T>
	where<T1, T2, T3>(predicate: Expression<(t1: T1, t2: T2, t3: T3) => boolean>): SelectExpr<T>
	where<T1, T2, T3, T4>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => boolean>): SelectExpr<T>
	where<T1, T2, T3, T4, T5>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => boolean>): SelectExpr<T>
	where<T1, T2, T3, T4, T5, T6>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => boolean>): SelectExpr<T>



	/** Select方法只能调用一次 */

	select(fields?: string): SelectExpr<T>
	select<TReturn>(fields: Expression<(m: T) => TReturn> | string): SelectExpr<TReturn>
	select<T1, TReturn>(fields?: Expression<(m: T1) => TReturn> | string): SelectExpr<TReturn>
	select<T1, T2, TReturn>(fields?: Expression<(t1: T1, t2: T2) => TReturn> | string): SelectExpr<TReturn>
	select<T1, T2, T3, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3) => TReturn> | string): SelectExpr<TReturn>
	select<T1, T2, T3, T4, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => TReturn> | string): SelectExpr<TReturn>
	select<T1, T2, T3, T4, T5, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => TReturn> | string): SelectExpr<TReturn>
	select<T1, T2, T3, T4, T5, T6, TReturn>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => TReturn> | string): SelectExpr<TReturn>

	/** 跳过数量 */
	skip(n: number): SelectExpr<T>

	/** 获取数量 */
	take(n: number): SelectExpr<T>

	/** 生成参数化的SQL语句 */
	toMergeSql(): string
	/** 生成SQL语句  */
	toSql(parms?: any[]): ParamSql

	queryList(): Promise<T[]>
	queryList<TModel>(): Promise<TModel[]>

	querySingle(): Promise<T>
	querySingle<TModel>(): Promise<TModel>
}

export function isSqlExp(expr: any): expr is SelectExpr<any> {
	return typeof (expr) === "object" && ['toSql', 'toMergeSql'].every(m => m in expr)
}

export interface SqlJoin2<T, T1, T2> {
	on(on: Expression<(tab1: T1, tab2: T2) => boolean>): SelectExpr<T>
}

export interface SqlJoin3<T, T1, T2, T3> extends SqlJoin2<T, T1, T2> {
	on(on: Expression<(tab1: T1, tab2: T2, tab3: T3) => boolean>): SelectExpr<T>
}

export interface SqlJoin4<T, T1, T2, T3, T4> extends SqlJoin3<T, T1, T2, T3> {
	on(on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4) => boolean>): SelectExpr<T>
}
export interface SqlJoin5<T, T1, T2, T3, T4, T5> extends SqlJoin4<T, T1, T2, T3, T4> {
	on(on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4, tab5?: T5) => boolean>): SelectExpr<T>
}
export interface SqlJoin6<T, T1, T2, T3, T4, T5, T6> extends SqlJoin5<T, T1, T2, T3, T4, T5> {
	on(on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4, tab5?: T5, tab6?: T6) => boolean>): SelectExpr<T>
}

