interface ISqlExpr<T extends object> {
    Where(p: (i: Builder<T>) => BoolExprBuilder): ISqlExpr<T>
    ToSql(): String
}

/** 所有操作类型的枚举 */
type EnumExprKind = EnumExprKindUnary | EnumExprKindBinary;

/** 一元操作枚举 */
enum EnumExprKindUnary {
    MemberAccess = "member_access",
    ValAccess = "val_access",
}

/** 二元操作枚举 */
enum EnumExprKindBinary {
    Equals = "equals",
    Like = "like",
    And = "and",
    Or = "or"
}


type Expr =
    | { kind: EnumExprKindBinary, left: Expr, rigth: Expr }
    | { kind: EnumExprKindUnary.ValAccess, value: any }
    | { kind: EnumExprKindUnary.MemberAccess, member: string }


interface StringExprBuilder {
    eq(s: string | StringExprBuilder): BoolExprBuilder
    like(s: string | StringExprBuilder): BoolExprBuilder
    getExpr(): Expr
}

interface BoolExprBuilder {
    eq(s: boolean | BoolExprBuilder): BoolExprBuilder
    and(e: BoolExprBuilder): BoolExprBuilder
    or(...e: BoolExprBuilder[]): BoolExprBuilder
    getExpr(): Expr
}

interface NumberExprBuilder {
    eq(s: number | NumberExprBuilder): BoolExprBuilder
    getExpr(): Expr
}

type Builder<T extends object> = {
    [k in keyof T]: T[k] extends string ? StringExprBuilder :
    T[k] extends number ? NumberExprBuilder :
    BoolExprBuilder
}

class ExprBuilder implements StringExprBuilder, BoolExprBuilder, NumberExprBuilder {
    constructor(public readonly ast: Expr) { }

    getExpr = () => this.ast

    eq(v: string | number | boolean | StringExprBuilder | NumberExprBuilder | BoolExprBuilder): BoolExprBuilder {
        if (v instanceof ExprBuilder) {
            return new ExprBuilder(createBinaryExpression(EnumExprKindBinary.Equals, this.ast, (v as ExprBuilder).getExpr()))
        }
        return new ExprBuilder(createBinaryExpression(EnumExprKindBinary.Equals, this.ast, createValExpression(v)))
    }

    and(e: BoolExprBuilder): BoolExprBuilder {
        return new ExprBuilder((createBinaryExpression(EnumExprKindBinary.And, this.ast, e.getExpr())))
    }

    or(e: BoolExprBuilder): BoolExprBuilder {

        return new ExprBuilder(createBinaryExpression(EnumExprKindBinary.Or, this.ast, e.getExpr()))
    }

    like(e: ExprBuilder | string) :BoolExprBuilder{

        if (typeof e == 'string')
            return new ExprBuilder(createBinaryExpression(EnumExprKindBinary.Like, this.ast, createValExpression(e)))

        return new ExprBuilder(createBinaryExpression(EnumExprKindBinary.Like, this.ast, e.getExpr()))
    }
}


const handler = {
    get(_: any, name: string) {
        console.info(name)
        return new ExprBuilder({
            kind: EnumExprKindUnary.MemberAccess,
            member: name
        })
    },
};

const builder = <T extends object>() => new Proxy<T>({} as any, handler);


const createValExpression = <T>(v: any): Expr => ({
    kind: EnumExprKindUnary.ValAccess,
    value: v
})

const createBinaryExpression = <T>(kind: EnumExprKindBinary, left: Expr, rigth: Expr): Expr => ({
    kind, left, rigth
})




class Sql {
    static or(...e: BoolExprBuilder[]) {
        let exp = e[0]
        if (e.length > 1) {
            //多个条件时，自动合并
            e.slice(1).forEach(element => {
                exp = exp.or(element)
            });
        }
        return exp
    }

    static and(...e: BoolExprBuilder[]) {
        let exp = e[0]
        if (e.length > 1) {
            //多个条件时，自动合并
            e.slice(1).forEach(element => {
                exp = exp.and(element)
            });
        }
        return exp
    }
}


const convertExpr = (e: Expr): any => {
    if (e.kind == EnumExprKindUnary.MemberAccess) return e.member
    if (e.kind == EnumExprKindUnary.ValAccess) return e.value
    if (e.kind == EnumExprKindBinary.Equals) return `(${convertExpr(e.left)} = ${convertExpr(e.rigth)})`
    if (e.kind == EnumExprKindBinary.Like) return `(${convertExpr(e.left)} like '${convertExpr(e.rigth)}')`
    if (e.kind == EnumExprKindBinary.Or) return `(${convertExpr(e.left)} or ${convertExpr(e.rigth)})`
    if (e.kind == EnumExprKindBinary.And) return `(${convertExpr(e.left)} and ${convertExpr(e.rigth)})`
}


const FromDB = <T extends object>(): ISqlExpr<T> => {
    const exprs: Expr[] = []

    return {
        Where(predicate) {
            exprs.push(predicate(builder()).getExpr())
            return this
        },
        ToSql() {

            return convertExpr(exprs[0])
        }
    }
}


interface Blog {
    Id: number
    Title: string
}


let a = FromDB<Blog>()
    .Where(b => Sql.or(b.Id.eq(1), b.Id.eq(2), b.Id.eq(6)).and(b.Title.like('%Blog')))
    .ToSql()

console.info(a)