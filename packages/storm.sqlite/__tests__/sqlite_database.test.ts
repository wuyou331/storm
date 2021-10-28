
import { Database } from 'storm/index';
import { SqliteDatabase } from '../src/sqlite_database';


export class Blog {
    public Id: number
}

const db: Database = new SqliteDatabase("data.db")

test('from', () => {

    const sql = db.From(Blog)


    expect(sql.GetList())
});



