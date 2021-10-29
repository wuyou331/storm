
import { Database } from 'storm';
import { SqliteDatabase } from '../src/sqlite_database';
import { Blog } from './model';


const db: Database = new SqliteDatabase("__tests__\\data.db")


test('queryList', async () => {
    const sql = db.from(Blog).select((b: Blog) => ({ blogId: b.Id }))
    for (const row of await sql.queryList()) {
        expect(row).toHaveProperty("blogId")
    }


});


test('querySingle', async () => {
    const sql = db.from(Blog).select((b: Blog) => ({ blogId: b.Id }))
    expect(sql.querySingle()).resolves.toHaveProperty("blogId")

});
