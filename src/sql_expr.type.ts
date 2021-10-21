import { Expression, ExpressionNode } from "tst-expression";

export interface SqlExpr<T> {
    Join<T1>(ctor2: { new(): T1 }): SqlJoin2<T, T, T1>
    Join<T1, T2>(ctor1: { new(): T1 }, ctor2: { new(): T2 }): SqlJoin2<T, T1, T2>
    Join<T1, T2, T3>(ctor1: { new(): T1 }, ctor2: { new(): T2 }, ctor3?: { new(): T3 }): SqlJoin3<T, T1, T2, T3>
    Join<T1, T2, T3, T4>(ctor1: { new(): T1 }, ctor2: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }): SqlJoin4<T, T1, T2, T3, T4>
    Join<T1, T2, T3, T4, T5>(ctor1: { new(): T1 }, ctor2: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }): SqlJoin5<T, T1, T2, T3, T4, T5>
    
	Where(predicate: Expression<(m: T) => boolean>): SqlExpr<T>
	Where<T1>(predicate: Expression<(m: T1) => boolean>): SqlExpr<T>
	Where<T1, T2>(predicate: Expression<(t1: T1, t2: T2) => boolean>): SqlExpr<T>
	Where<T1, T2, T3>(predicate: Expression<(t1: T1, t2: T2, t3: T3) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4) => boolean>): SqlExpr<T>
	Where<T1, T2, T3, T4, T5>(predicate: Expression<(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => boolean>): SqlExpr<T> 
    ToSql(): String
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


