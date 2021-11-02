
import { Expression } from "tst-expression";
import * as sqlite3 from 'sqlite3';
import * as storm from 'storm';
import { SqliteSqlExpr } from "./sqlite_expr";
import { ParamSql } from './../../storm/src/sql_expr_type';

export class SqliteDatabase implements storm.Database {
    private readonly db: sqlite3.Database
    constructor(connStr: string) {
        this.db = new sqlite3.Database(connStr);

    }



    public from = <T extends object>(ctor: new () => T, alias?: string): storm.SqlExpr<T> => new SqliteSqlExpr<T>(ctor, this, alias)

    update<T extends object>(item: T, where: Expression<(p: T) => boolean>): Promise<number> {
        const paramSql = storm.SqlUtils.update(item, where, true) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }
    updateAll<T extends object>(item: T): Promise<number> {
        const paramSql = storm.SqlUtils.updateAll(item, true) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }
    updateFields<T extends object>(fields: Expression<T>, where: Expression<(p: T) => boolean>): Promise<number> {
        const paramSql = storm.SqlUtils.updateFieldsExpr(fields, where, true) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }
    updateFieldsForAll<T extends object>(fields: Expression<T>): Promise<number> {
        const paramSql = storm.SqlUtils.updateFieldsForAll(fields, true) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }

    /** 执行SQL语句并返回受影响的行数     */
    private excuteSqlReturnChanges(paramSql: ParamSql): Promise<number> {
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

    insert<T extends object>(item: T | Expression<() => T>): Promise<undefined>;
    insert<T extends object>(item: T | Expression<() => T>, returnId: true): Promise<number>;
    insert<T extends object>(item: T | Expression<() => T>, returnId?: boolean): Promise<number> | Promise<undefined> {
        const paramSql = storm.SqlUtils.insertExpr(item, true) as storm.ParamSql
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