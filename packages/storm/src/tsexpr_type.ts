import { ExpressionKind, ExpressionNode, IdentifierExpressionNode } from "tst-expression";


export function IsAsExpression(expr: ExpressionNode): expr is AsExpression {
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