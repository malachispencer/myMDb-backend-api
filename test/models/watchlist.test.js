const pool = require('../../db/dbConnection');
const testDB = require('../testDB');
const Watchlist = require('../../models/watchlist');

describe('Watchlist', () => {
  let userID;

  beforeEach(async () => {
    await testDB.clean();

    userID = await pool.query(
      `INSERT INTO users 
      (username, email, password) VALUES ($1, $2, $3)
      RETURNING user_id`, ['malachi', 'm.spencer@makers.com', '2020']
    ).then(res => { return res.rows[0].user_id });
  });

  afterAll(async () => {
    await testDB.close();
  });

  describe('.add', () => {
    test('adds a watchlist entry to the database', async () => {
      await Watchlist.add(userID, 1);

      const sql = `SELECT * FROM watchlist WHERE user_id = $1 AND movie_id = $2`;
      const values = [userID, 1];

      const watchlistItemFromDB = await pool
        .query(sql, values)
        .then(res => { return res.rows[0]; })
            
      expect(watchlistItemFromDB.user_id).toEqual(userID);
      expect(watchlistItemFromDB.movie_id).toBe('1');
    });
  });

  describe('.retrieve', () => {
    test(`gets and returns a user's entire watchlist`, async () => {
      await Watchlist.add(userID, 1);
      await Watchlist.add(userID, 2);
      await Watchlist.add(null, 1);

      const watchlist = await Watchlist.retrieve(userID);

      expect(watchlist.userID).toEqual(userID);
      expect(watchlist.movieIDs).toBeInstanceOf(Array);
      expect(watchlist.movieIDs).toContain('1');
      expect(watchlist.movieIDs).toContain('2');
    });
  });

  describe('.delete', () => {
    test('deletes a watchlist entry from the database', async () => {
      await Watchlist.add(userID, 1);
      await Watchlist.delete(userID, 1);

      const sql = `SELECT * FROM watchlist WHERE user_id = $1 AND movie_id = $2`;
      const values = [userID, 1];

      const dbResponse = await pool
        .query(sql, values)
        .then(res => { return res.rows[0]; })

       expect(dbResponse).toBeUndefined();
    });
  });
});