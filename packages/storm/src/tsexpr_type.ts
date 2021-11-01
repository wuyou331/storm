import { ExpressionKind, ExpressionNode, IdentifierExpressionNode } from "tst-expression";


export function assertAsExpression(expr: ExpressionNode): expr is AsExpression {
    if (expr.kind !== ExpressionKind.AsExpression) {
        throw new Error("Argument is not an AsExpression.")
    } else
        return true
}
export function isAsExpression(expr: ExpressionNode): expr is AsExpression {
    return expr.kind === ExpressionKind.AsExpression
}

export interface AsExpression extends ExpressionNode {
    expression: ExpressionNode
    flags: 0
    kind: ExpressionKind.AsExpression
    type: TypeReferenceExpression
}


export interface TypeReferenceExpression extends ExpressionNode {
    flags: 0
    kind: ExpressionKind.TypeReference,
    typeName: IdentifierExpressionNode
}