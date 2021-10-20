import { assertArrowFunctionExpression, assertBinaryExpression, assertExpression, assertIdentifier, Expression, ExpressionKind, ExpressionNode, isBinaryExpression, isNumericLiteral, isPropertyAccessExpression, isStringLiteral } from "tst-expression";

interface ISqlExpr<T> {
	Join<T1>(ctor2: { new(): T1 }): ISqlJoinExpr2<T, T, T1>
	Join<T1, T2>(ctor1: { new(): T1 }, ctor2: { new(): T2 }): ISqlJoinExpr2<T, T1, T2>
	Join<T1, T2, T3>(ctor1: { new(): T1 }, ctor2: { new(): T2 }, ctor3?: { new(): T3 }): ISqlJoinExpr3<T, T1, T2, T3>
	Join<T1, T2, T3, T4>(ctor1: { new(): T1 }, ctor2: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }): ISqlJoinExpr4<T, T1, T2, T3, T4>
	Join<T1, T2, T3, T4, T5>(ctor1: { new(): T1 }, ctor2: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }): ISqlJoinExpr5<T, T1, T2, T3, T4, T5>
	Where(expr: Expression<(m: T) => boolean>): ISqlExpr<T>
	ToSql(): String
}


interface ISqlJoinExpr2<T, T1, T2> {
	ON(on: Expression<(tab1: T1, tab2: T2) => boolean>): ISqlExpr<T>
}

interface ISqlJoinExpr3<T, T1, T2, T3> extends ISqlJoinExpr2<T, T1, T2> {
	ON(on: Expression<(tab1: T1, tab2: T2, tab3: T3) => boolean>): ISqlExpr<T>
}

interface ISqlJoinExpr4<T, T1, T2, T3, T4> extends ISqlJoinExpr3<T, T1, T2, T3> {
	ON(on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4) => boolean>): ISqlExpr<T>
}
interface ISqlJoinExpr5<T, T1, T2, T3, T4, T5> extends ISqlJoinExpr4<T, T1, T2, T3, T4> {
	ON(on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4, tab5?: T5) => boolean>): ISqlExpr<T>
}




class SqlTableJoin {
	constructor(public Ctor: { new(): any }, public Alias?: string, public ON?: ExpressionNode) { }
}

class SqlExpression<T> implements ISqlExpr<T>{

	private whereConditions: ExpressionNode[] = []
	/** 已经加入到SQL语句中的表和别名,第一个元素是from后面的主表 */
	private joins: SqlTableJoin[] = []

	constructor(mianCtor: { new(): T }, alias?: string) {
		this.joins.push(new SqlTableJoin(mianCtor, alias))
	}

	/** 转换条件表达式为SQL语句部分 */
	private convertCondition(expr: ExpressionNode) {
		const operatorMap: { [kind: number]: string } = {
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
		};
		if (isBinaryExpression(expr))
			if (expr.operatorToken.kind == ExpressionKind.BarBarToken || expr.operatorToken.kind == ExpressionKind.AmpersandAmpersandToken)
				return `(${this.convertCondition(expr.left)} ${operatorMap[expr.operatorToken.kind]} ${this.convertCondition(expr.right)})`
			else
				return `${this.convertVal(expr.left)} ${operatorMap[expr.operatorToken.kind]} ${this.convertVal(expr.right)}`
		else if (expr.kind == ExpressionKind.TrueKeyword) return "1==1";
		else if (expr.kind == ExpressionKind.FalseKeyword) return "1<>1";
	}

	/** 转换条件表达式左右两边的值为SQL语句 */
	private convertVal(expr: ExpressionNode) {
		if (isBinaryExpression(expr))
			this.convertCondition(expr)
		else if (isPropertyAccessExpression(expr)) {
			if (this.joins.length == 1)
				return expr.name.escapedText
			else {
				assertIdentifier(expr.expression)
				return `${expr.expression.escapedText}.${expr.name.escapedText}`
			}
		}
		else if (isNumericLiteral(expr) || isStringLiteral(expr)) return expr.text
		else if (expr.kind == ExpressionKind.TrueKeyword) return "1"
		else if (expr.kind == ExpressionKind.FalseKeyword) return "0"
	}

	private convertTableName(join: SqlTableJoin) {
		if (join.Alias) {
			return `${join.Ctor.name} as ${join.Alias}`;
		} else {
			return `${join.Ctor.name}`;
		}
	}

	private convertWhere() {
		if (this.whereConditions.length == 0) return ""
		let whereStr = "\r\nwhere "
		this.whereConditions.forEach((expr, i) => {
			whereStr += this.convertCondition(expr)
			if (i < this.whereConditions.length - 1)
				whereStr += " and "
		});
		return whereStr
	}

	private converJoin() {
		if (this.joins.length == 0) return ""
		let whereStr = ""
		this.joins.forEach((join, i) => {
			if (i > 0)
				whereStr += `\r\njoin ${this.convertTableName(join)} on ${this.convertCondition(join.ON)}`
		});
		return whereStr
	}



	//方法签名需注意ctor2参数在接口中是必填的，但在实际的方法中是选填的
	Join<T1>(ctor2: { new(): T1 }): ISqlJoinExpr2<T, T, T1>
	Join<T1, T2>(ctor1: { new(): T1 }, ctor2?: { new(): T2 }): ISqlJoinExpr2<T, T1, T2>
	Join<T1, T2, T3>(ctor1: { new(): T1 }, ctor2?: { new(): T2 }, ctor3?: { new(): T3 }): ISqlJoinExpr3<T, T1, T2, T3>
	Join<T1, T2, T3, T4>(ctor1: { new(): T1 }, ctor2?: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }): ISqlJoinExpr4<T, T1, T2, T3, T4>
	Join<T1, T2, T3, T4, T5>(ctor1: { new(): T1 }, ctor2?: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }, ctor5?: { new(): T4 }): ISqlJoinExpr5<T, T1, T2, T3, T4, T5> {
		const On = (on: Expression<(tab1: T1, tab2: T2, tab3?: T3, tab4?: T4, tab5?: T5) => boolean>): ISqlExpr<T> => {
			assertExpression(on)
			assertArrowFunctionExpression(on.expression)
			let expr = on.expression
			var ctors: { new(): any }[] = [ctor1, ctor2, ctor3, ctor4, ctor5].filter(it => it != null)
			//join方法只有一个参数时，默认与主表连接
			if (ctors.length == 1)
				ctors = [this.joins[0].Ctor, ...ctors]
			let newCtor: { new(): any }
			let newAlias: string
			ctors.forEach((ctor, i) => {
				let alias = expr.parameters[i].name.escapedText
				if (ctor == this.joins[0].Ctor && this.joins[0].Alias == null)
					this.joins[0].Alias = alias

				//join方法可以同时多个表，需找出新表
				if (this.joins.findIndex(j => j.Ctor == ctor && j.Alias == alias) == -1) {
					newCtor = ctor
					newAlias = alias
				}

			})
			if (newCtor == null)
				throw Error(`Join表达式有误，类型或别名与之前的Join冲突\r\nJoin(${ctors.map(c => c.name).join(',')}).ON(${on.compiled})`)

			this.joins.push(new SqlTableJoin(newCtor, newAlias, expr.body))
			return this;
		}
		return { ON: On };
	}


	Where(predicate: Expression<(m: T) => boolean>) {
		assertExpression(predicate)
		assertArrowFunctionExpression(predicate.expression)

		let expression = predicate.expression.body;
		if (expression.kind == ExpressionKind.Block) {
			throw new Error("Arrow function cannot have block body.");
		}
		this.whereConditions.push(expression)
		return this
	}




	ToSql() {
		return `select * from ${this.convertTableName(this.joins[0])} ${this.converJoin()} ${this.convertWhere()}`
	}
}






const From = <T extends object>(ctor: { new(): T }): ISqlExpr<T> => new SqlExpression<T>(ctor)


class User {
	Id: number
	Name: string
	Gender: boolean
}

class Blog {
	Id: number
	UserId: number
	Title: string
}

class Comment {
	Id: number
	UserId: number
	BlogId: number
	Content: string
}

var sql = From(Blog)
	.Join(User).ON((b, u) => b.UserId == u.Id)
	.Join(Comment).ON((b, u) => b.Id == u.BlogId)
	.Where(b => b.Id == 1 || true)
	.Where(b => b.UserId == 1)
	.ToSql()

console.info(sql)

