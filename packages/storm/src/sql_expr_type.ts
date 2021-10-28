import { Expression, ExpressionNode } from "tst-expression";

export class ParmSql {
	public sql: string
	public parms: any[] = []

}
export interface SqlExpr<T> {
	Join<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	Join<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	Join<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	Join<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	Join<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	Join<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin5<T, T1, T2, T3, T4, T5>

	InnerJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	InnerJoin<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	InnerJoin<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	InnerJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	InnerJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	InnerJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6>

	LeftJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	LeftJoin<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	LeftJoin<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	LeftJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	LeftJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	LeftJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6>

	RightJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	RightJoin<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	RightJoin<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	RightJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	RightJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	RightJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6>


	FullJoin<T1>(ctor2: new () => T1): SqlJoin2<T, T, T1>
	FullJoin<T1, T2>(ctor1: new () => T1, ctor2: new () => T2): SqlJoin2<T, T1, T2>
	FullJoin<T1, T2, T3>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3): SqlJoin3<T, T1, T2, T3>
	FullJoin<T1, T2, T3, T4>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4): SqlJoin4<T, T1, T2, T3, T4>
	FullJoin<T1, T2, T3, T4, T5>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5): SqlJoin5<T, T1, T2, T3, T4, T5>
	FullJoin<T1, T2, T3, T4, T5, T6>(ctor1: new () => T1, ctor2: new () => T2, ctor3?: new () => T3, ctor4?: new () => T4, ctor5?: new () => T5, ctor6?: new () => T6): SqlJoin6<T, T1, T2, T3, T4, T5, T6>


	Where(predicate: Expression<(m: T) => boolean>): SqlExpr<T>
	Where<T1>(predicate: Expression<(m: T1) => boolean>): SqlExpr<T>
	Where<T1, T2>(predicate: Expression<(t1: T1, t2: T2) => boolean>): SqlExpr<T>
	Where<T1, T2, T3>(predicate: Expression<(t1: T1, t2: T2, t3: T3) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4, T5>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4, T5, T6>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => boolean>): SqlExpr<T>

	/** Select方法只能调用一次 */
	Select(): SqlExpr<T>
	Select<TReturn>(fields?: Expression<(m: T) => TReturn>): SqlExpr<T> | SqlExpr<TReturn>
	Select<T1>(fields?: Expression<(m: T1) => any> | string): SqlExpr<T>
	Select<T1, T2>(fields?: Expression<(t1: T1, t2: T2) => any> | string): SqlExpr<T>
	Select<T1, T2, T3>(fields?: Expression<(t1: T1, t2: T2, t3: T3) => any> | string): SqlExpr<T>
	Select<T1, T2, T3, T4>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => any> | string): SqlExpr<T>
	Select<T1, T2, T3, T4, T5>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => any> | string): SqlExpr<T>
	Select<T1, T2, T3, T4, T5, T6>(fields?: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6) => any> | string): SqlExpr<T>

	/** 讲参数和SQL语句合并 */
	ToMergeSql(): string

	ToSql(): ParmSql

	GetList(): Promise<T[]>
	GetList<TModel>(): Promise<TModel[]>
}


export interface SqlJoin2<T, T1, T2> {
	ON(on: Expression<(tab1: T1, tab2: T2) => boolean>): SqlExpr<T>
}

export interface SqlJoin3<T, T1, T2, T3> extends SqlJoin2<T, T1, T2> {
	ON(on: Expression<(tab1: T1, tab2: T2, tab3: T3) => boolean>): SqlExpr<T>
}

export interface SqlJoin4<T, T1, T2, T3, T4> extends SqlJoin3<T, T1, T2, T3> {
	ON(on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4) => boolean>): SqlExpr<T>
}
export interface SqlJoin5<T, T1, T2, T3, T4, T5> extends SqlJoin4<T, T1, T2, T3, T4> {
	ON(on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4, tab5?: T5) => boolean>): SqlExpr<T>
}
export interface SqlJoin6<T, T1, T2, T3, T4, T5, T6> extends SqlJoin5<T, T1, T2, T3, T4, T5> {
	ON(on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4, tab5?: T5, tab6?: T6) => boolean>): SqlExpr<T>
}

