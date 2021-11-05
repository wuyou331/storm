
import { Expression } from "tst-expression";
import * as mssql from 'mssql';
import * as storm from 'storm';
import { MsSqlExpr } from './mssql_expr';
import { ParamSql } from './../../storm/src/sql_expr';

export class MssqlDatabase implements storm.Database {
    private db: mssql.ConnectionPool
    constructor(private connectString: string) {


    }

    async connect() {
        this.db = await mssql.connect(this.connectString)

    }

    async getDb() {
        if (this.db == null)
            await this.connect()
        return this.db

    }
    public from = <T extends object>(ctor: new () => T, alias?: string): storm.SqlExpr<T> => new MsSqlExpr<T>(ctor, this, alias)

    delete<T extends object>(ctor: new () => T, where: Expression<(t: T) => boolean>): Promise<number> {
        const paramSql = storm.SqlUtils.deleteExpr(ctor, where, true) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }

    deleteAll<T extends object>(ctor: new () => T): Promise<number> {
        const paramSql = storm.SqlUtils.deleteExpr(ctor, undefined, true) as storm.ParamSql
        return this.excuteSqlReturnChanges(paramSql)
    }

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
    private async excuteSqlReturnChanges(paramSql: storm.ParamSql): Promise<number> {
        const request = (await this.getDb()).request()
        paramSql.params.forEach((param, index) => {
            request.input(`${index}`, param)
        })

        return new Promise<number>((resolve, reject) => {
            request.execute(paramSql.sql, (err, result, returnVal) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(result.returnValue)
                }
            })
        })
    }

    insert<T extends object>(item: Expression<T>): Promise<undefined>
    insert<T extends object>(item: Expression<T>, returnId: true): Promise<number>
    insert<T extends object>(item: Expression<T>, returnId?: boolean): Promise<number> | Promise<undefined> {
        const paramSql = storm.SqlUtils.insertExpr(item, true) as storm.ParamSql
        return this.excuteInsert(paramSql, returnId)
    }


    insertFields<T extends object>(item: Expression<T>): Promise<undefined>
    insertFields<T extends object>(item: Expression<T>, returnId: true): Promise<number>
    insertFields<T extends object>(item: Expression<T>, returnId?: boolean): Promise<undefined> | Promise<number> {
        const paramSql = storm.SqlUtils.insertFieldsExpr(item, true) as storm.ParamSql
        return this.excuteInsert(paramSql, returnId)
    }

    private async excuteInsert(paramSql: ParamSql, returnId: boolean) {
        const request = (await this.getDb()).request()
        paramSql.params.forEach((param, index) => {
            request.input(`${index}`, param)
        })
        if (returnId) {
            paramSql.sql += ';select SCOPE_IDENTITY() as id;';
        }

        return new Promise<number>((resolve, reject) => {

            request.query(paramSql.sql, (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(returnId ? 1 : undefined)
                }
            })
        })
    }

    async queryList<T>(sql: storm.ParamSql): Promise<T[]> {
        const request = (await this.getDb()).request()
        sql.params.forEach((param, index) => {
            request.input(`${index}`, param)
        })
        return new Promise<T[]>((resolve, reject) => {
            request.query<T>(sql.sql, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows.recordset)
                }
            })
        });
    };


    async querySingle<T>(sql: storm.ParamSql): Promise<T> {
        const request = (await this.getDb()).request()
        sql.params.forEach((param, index) => {
            request.input(`${index}`, param)
        })
        return new Promise<T>((resolve, reject) => {
            request.query<T>(sql.sql, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows.recordset.length > 0 ? rows.recordset[0] : undefined)
                }
            });
        });
    }
}