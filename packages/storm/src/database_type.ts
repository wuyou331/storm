import { Expression } from "tst-expression";
import { ParamSql, SqlExpr } from "./sql_expr_type";


export interface Database {
    from<T extends object>(ctor: new () => T, alias?: string): SqlExpr<T>

    queryList<T>(sql: ParamSql): Promise<T[]>
    querySingle<T>(sql: ParamSql): Promise<T>

    /** 插入记录
     *  @example
     *  insert(blog)
     *  or
     *  insert({ UserId: 1, Title: blog.Title } as Blog)
     */
    insert<T extends object>(item: T | Expression<() => T>): Promise<undefined>;
    insert<T extends object>(item: T | Expression<() => T>, returnId: true): Promise<number>;
    insert<T extends object>(item: T | Expression<() => T>, returnId?: boolean): Promise<number> | Promise<undefined>




    /** 更新所有字段
     * @example
     * SqlUtils.update(blog, b => b.Id === 1)
     */
    update<T extends object>(item: T, where: Expression<(p: T) => boolean>): Promise<number>

    /** 全表更新所有字段
     * @example
     * SqlUtils.updateAll(blog)
     */
    updateAll<T extends object>(item: T): Promise<number>

    /** 更新部分字段
     * @example
     * SqlUtils.updateFields({ Title: "abc" } as Blog, b => b.Id === 1)
     */
    updateFields<T extends object>(fields: Expression<T>, where: Expression<(p: T) => boolean>): Promise<number>


    /** 全表更新部分字段
     * @example
     * SqlUtils.updateFields({ Title: "abc" } as Blog)
     */
    updateFieldsForAll<T extends object>(fields: Expression<T>): Promise<number>


    delete<T extends object>(ctro:new()=>T, where: Expression<(t: T) => boolean>): Promise<number>
    deleteAll<T extends object>(ctor: new () => T): Promise<number>

}