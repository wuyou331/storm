import { assertArrowFunctionExpression, assertBinaryExpression, assertExpression, Expression, ExpressionKind, ExpressionNode, isBinaryExpression, isNumericLiteral, isPropertyAccessExpression, isStringLiteral } from "tst-expression";

interface ISqlExpr<T> {
	Join<T1, T2, T3, T4>(ctor1: { new(): T1 }, ctor2: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }): ISqlJoinExpr<T, T1, T2, T3, T4>
	Where(expr: Expression<(m: T) => boolean>): ISqlExpr<T>
	ToSql(): String
}


interface ISqlJoinExpr<T, T1, T2, T3, T4> {
	ON(on: Expression<(ctor1: T1, ctor2: T2, ctor3?: T3, ctor4?: T4) => boolean>): ISqlExpr<T>
}

class SqlTableJoin {
	constructor(Ctor: { new(): any }, Alias?: string, On?: ExpressionNode) { }
}

class SqlExpression<T> implements ISqlExpr<T>{

	private whereConditions: ExpressionNode[] = []
	private tables: SqlTableJoin[] = []

	constructor(private ctor: { new(): T }) {
		this.tables.push({ Ctor: ctor });
	}

	private readonly convertCondition = (expr: ExpressionNode) => {
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

	private readonly convertVal = (expr: ExpressionNode) => {
		if (isBinaryExpression(expr))
			this.convertCondition(expr)
		else if (isPropertyAccessExpression(expr)) return expr.name.escapedText;
		else if (isNumericLiteral(expr) || isStringLiteral(expr)) return expr.text;
		else if (expr.kind == ExpressionKind.TrueKeyword) return "1";
		else if (expr.kind == ExpressionKind.FalseKeyword) return "0";
	}


	Join<T1, T2, T3, T4>(ctor1: { new(): T1 }, ctor2?: { new(): T2 }, ctor3?: { new(): T3 }, ctor4?: { new(): T4 }): ISqlJoinExpr<T, T1, T2, T3, T4> {
		let _this: ISqlExpr<T> = this;
		return {
			ON(on: Expression<(ctor1: T1, ctor2: T2, ctor3?: T3, ctor4?: T4) => boolean>): ISqlExpr<T> {
				assertExpression(on)
				assertArrowFunctionExpression(on.expression)
				assertBinaryExpression(on.expression.body)
				//	this.tables.push(new SqlTableJoin(ctor2, on.expression.parameters[1].name.escapedText, on.expression))
				return _this;
			}
		};
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
		let whereStr = "Where "
		this.whereConditions.forEach((expr, i) => {
			whereStr += this.convertCondition(expr)
			if (i < this.whereConditions.length - 1)
				whereStr += " And "
		});


		return `Select * From ${this.ctor.name} ${this.whereConditions.length > 0 ? whereStr : ""}`
	}
}


const From = <T extends object>(ctor: { new(): T }): ISqlExpr<T> => new SqlExpression<T>(ctor)


class User {
	Id: number
	Name: string
	Sex: boolean
}
class Blog {
	Id: number
	UserId: number
	Title: string
	Sex: boolean
}

class Comment {
	Id: number
	BlogId: number
	Content: string
}

var sql = From(Blog)
	.Join(Blog, User).ON((b, u) => b.UserId == u.Id)
	.Join(Blog, User, Comment).ON((b, u, c) => b.UserId == u.Id && c.BlogId == b.Id)
	.Where(b => b.Id == 1 || true)
	.Where(b => b.Sex == true)
	.ToSql()

console.info(sql)

