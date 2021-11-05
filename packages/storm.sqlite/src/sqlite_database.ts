
import { Expression } from "tst-expression";
import * as sqlite3 from 'sqlite3';
import * as storm from 'storm';
import { SqliteSqlExpr } from "./sqlite_expr";
import { _SQLCHAR } from 'storm/src/select_expr_default';
import { SqliteSqlBuilder } from "./sqlite_sql_builder";

export class SqliteDatabase implements storm.Database {
    private readonly db: sqlite3.Database
    constructor(connStr: string) {
        this.db = new sqlite3.Database(connStr);

    }


    public from = <T extends object>(ctor: new () => T, alias?: string): storm.SelectExpr<T> => new SqliteSqlExpr<T>(ctor, this, alias)

    private createBuilder = () => new SqliteSqlBuilder(_SQLCHAR, undefined, [])

    delete<T extends object>(ctor: new () => T, where: Expression<(t: T) => boolean>): Promise<number> {
        const paramSql = this.createBuilder().deleteExpr(ctor, where) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }

    deleteAll<T extends object>(ctor: new () => T): Promise<number> {
        const paramSql = this.createBuilder().deleteExpr(ctor, undefined) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }

    update<T extends object>(item: T, where: Expression<(p: T) => boolean>): Promise<number> {
        const paramSql = this.createBuilder().update(item, where) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }
    updateAll<T extends object>(item: T): Promise<number> {
        const paramSql = this.createBuilder().updateAll(item) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }
    updateFields<T extends object>(fields: Expression<T>, where: Expression<(p: T) => boolean>): Promise<number> {
        const paramSql = this.createBuilder().updateFieldsExpr(fields, where) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }
    updateFieldsForAll<T extends object>(fields: Expression<T>): Promise<number> {
        const paramSql = this.createBuilder().updateFieldsForAll(fields) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }

    /** 执行SQL语句并返回受影响的行数     */
    private excuteSqlReturnChanges(paramSql: storm.ParamSql): Promise<number> {
        const stmt: sqlite3.Statement | sqlite3.RunResult = this.db.prepare(paramSql.sql)
        return new Promise<number>((resolve, reject) => {
            stmt.run(paramSql.params, (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    resolve((stmt as sqlite3.RunResult).changes)
                }
            })
        });
    }

    insert<T extends object>(item: Expression<T>): Promise<undefined>
    insert<T extends object>(item: Expression<T>, returnId: true): Promise<number>
    insert<T extends object>(item: Expression<T>, returnId?: boolean): Promise<number> | Promise<undefined> {
        const paramSql = this.createBuilder().insertExpr(item) as storm.ParamSql
        const stmt: sqlite3.Statement | sqlite3.RunResult = this.db.prepare(paramSql.sql)
        return new Promise<number>((resolve, reject) => {
            stmt.run(paramSql.params, (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    resolve((stmt as sqlite3.RunResult).lastID)
                }
            })
        });

    }


    insertFields<T extends object>(item: Expression<T>): Promise<undefined>
    insertFields<T extends object>(item: Expression<T>, returnId: true): Promise<number>
    insertFields<T extends object>(item: Expression<T>, returnId?: boolean): Promise<undefined> | Promise<number> {
        const paramSql = this.createBuilder().insertFieldsExpr(item) as storm.ParamSql
        const stmt: sqlite3.Statement | sqlite3.RunResult = this.db.prepare(paramSql.sql)
        return new Promise<number>((resolve, reject) => {
            stmt.run(paramSql.params, (err, _) => {
                if (err) {
                    reject(err)
                } else {
                    resolve((stmt as sqlite3.RunResult).lastID)
                }
            })
        });
    }


    public queryList<T>(sql: storm.ParamSql): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            this.db.all(sql.sql, sql.params, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            });
        });
    }

    public querySingle<T>(sql: storm.ParamSql): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.db.all(sql.sql, sql.params, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows.length > 0 ? rows[0] : undefined)
                }
            });
        });
    }
}