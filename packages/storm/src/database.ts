import { Expression } from "tst-expression";
import { ParamSql, SqlExpr } from "./sql_expr";


export interface Database {
    from<T extends object>(ctor: new () => T, alias?: string): SqlExpr<T>

    queryList<T>(sql: ParamSql): Promise<T[]>
    querySingle<T>(sql: ParamSql): Promise<T>

    /** 插入记录，包含实体的全部列
     *  @example
     *  insert(blog)
     *  or
     *  insert({ UserId: 1, Title: blog.Title } as Blog)
     */
    insert<T extends object>(item: Expression<T>): Promise<undefined>;
    insert<T extends object>(item: Expression<T>, returnId: true): Promise<number>;
    insert<T extends object>(item: Expression<T>, returnId?: boolean): Promise<number> | Promise<undefined>


    /** 插入记录，只包含实体的部分列
     *  @example
     *  insertFields({ UserId: 1, Title: blog.Title } as Blog)
     */
    insertFields<T extends object>(item: Expression<T>): Promise<undefined>;
    insertFields<T extends object>(item: Expression<T>, returnId: true): Promise<number>;
    insertFields<T extends object>(item: Expression<T>, returnId?: boolean): Promise<number> | Promise<undefined>


    /** 更新所有字段
     * @example
     * update(blog, b => b.Id === 1)
     */
    update<T extends object>(item: T, where: Expression<(p: T) => boolean>): Promise<number>

    /** 全表更新所有字段
     * @example
     * updateAll(blog)
     */
    updateAll<T extends object>(item: T): Promise<number>

    /** 更新部分字段
     * @example
     * updateFields({ Title: "abc" } as Blog, b => b.Id === 1)
     */
    updateFields<T extends object>(fields: Expression<T>, where: Expression<(p: T) => boolean>): Promise<number>


    /** 全表更新部分字段
     * @example
     * updateFields({ Title: "abc" } as Blog)
     */
    updateFieldsForAll<T extends object>(fields: Expression<T>): Promise<number>


    /**
     * 删除记录
     * @param ctro 要删除的对象构造方法
     * @param where 删除条件
     * @example
     * delete(Blog, b => b.Id === 1)
     */
    delete<T extends object>(ctro: new () => T, where: Expression<(t: T) => boolean>): Promise<number>


    /**
     * 全表删除记录
     * @param ctro 要删除的对象构造方法
     * @example
     * deleteAll(Blog)
     */
    deleteAll<T extends object>(ctor: new () => T): Promise<number>



}