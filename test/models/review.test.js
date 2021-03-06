const pool = require('../../db/dbConnection');
const testDB = require('../testDB');
const Review = require('../../models/review');

describe('Review', () => {
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

  describe('.create', () => {
    test('adds a review to the database', async () => {
      await Review.create(
        userID, 
        1, 
        'Loved it', 
        'One of the best movies of all time', 
        '10:40'
      );

      const sql = `SELECT * FROM reviews WHERE user_id = $1 AND movie_id = $2`;
      const values = [userID, 1];

      const reviewFromDB = await pool
        .query(sql, values)
        .then(res => { return res.rows[0]; })
        
      expect(reviewFromDB.user_id).toBe(userID);
      expect(reviewFromDB.movie_id).toBe('1');
      expect(reviewFromDB.title).toBe('Loved it');
      expect(reviewFromDB.body).toBe('One of the best movies of all time');
    });

    test('returns a Review instance', async () => {
      const review = await Review.create(
        userID, 
        1, 
        'Loved it', 
        'One of the best movies of all time', 
        '10:40'
      );

      expect(review.reviewID).toBeDefined();
      expect(review.userID).toBe(userID);
      expect(review.username).toBe('malachi');
      expect(review.movieID).toBe('1');
      expect(review.title).toBe('Loved it');
      expect(review.body).toBe('One of the best movies of all time');
      expect(review.time).toBe('10:40');
    });
  });

  describe('.allByUser', () => {
    test('returns all reviews made by the given user', async () => {
      await Review.create(
        userID, 
        1, 
        'Loved it', 
        'One of the best movies of all time', 
        '11:05'
      );

      await Review.create(
        userID, 
        2, 
        'Hated it', 
        'One of the worst of all time', 
        '11:06'
      );

      const userReviews = await Review.allByUser(userID);

      expect(userReviews).toBeInstanceOf(Array);
      expect(userReviews.length).toBe(2);
      expect(userReviews[0].username).toBe('malachi');
      expect(userReviews[1].username).toBe('malachi');
    });

    test('returns the reviews in descending order', async () => {
      await Review.create(
        userID, 
        1, 
        'Loved it', 
        'One of the best movies of all time', 
        '11:05'
      );

      await Review.create(
        userID, 
        2, 
        'Hated it', 
        'One of the worst of all time', 
        '11:06'
      );

      const userReviews = await Review.allByUser(userID);

      expect(userReviews[0].movieID).toBe('2');
      expect(userReviews[1].movieID).toBe('1');
      expect(userReviews[0].time).toBe('11:06');
      expect(userReviews[1].time).toBe('11:05');
    });
  });

  describe('.allForMovie', () => {
    test('returns all the reviews for a given movie in descending order', async () => {
      const aiUserID = await pool.query(
        `INSERT INTO users 
        (username, email, password) VALUES ($1, $2, $3)
        RETURNING user_id`, ['ai', 'ai@makers.com', '2020']
      ).then(res => { return res.rows[0].user_id });

      await Review.create(
        userID, 
        1, 
        'Loved it', 
        'One of the best movies of all time', 
        '12:38'
      );

      await Review.create(
        aiUserID,
        1,
        'It was okay',
        'Ending was a bit disappointing',
        '12:39'
      );

      await Review.create(
        userID, 
        2,
        'Hated it', 
        'One of the best worst of all time', 
        '11:06'
      );

      const movieReviews = await Review.allForMovie(1);
        
      expect(movieReviews).toBeInstanceOf(Array);
      expect(movieReviews).toHaveLength(2);
      expect(movieReviews[0].time).toBe('12:39');
      expect(movieReviews[1].time).toBe('12:38');
      expect(movieReviews[1].title).toBe('Loved it');
      expect(movieReviews[0].body).toBe('Ending was a bit disappointing');
    });
  });

  describe('.update', () => {
    test('updates the title and body of a review', async () => {
      const review = await Review.create(
        userID,
        1,
        'Loved it',
        'One of the best movies of all time',
        '14:21'
      );

      const updatedReview = await Review.update(
        review.reviewID,
        'Loved the film',
        'One of my favourite movies'
      );

      expect(review.reviewID).toEqual(updatedReview.reviewID);
      expect(updatedReview.title).toBe('Loved the film');
      expect(updatedReview.body).toBe('One of my favourite movies');
    });
  });

  describe('.delete', () => {
    test(`removes the user's review from the database`, async () => {
      const review = await Review.create(
        userID,
        1,
        'Loved it',
        'One of the best movies of all time',
        '14:21'
      );

      const returnValue = await Review.delete(review.reviewID);

      const dbResponse = await pool
        .query(`SELECT * FROM reviews WHERE review_id = $1`, [review.reviewID])
        .then(res => { return res.rows[0]; })

      expect(dbResponse).toBeUndefined();
      expect(returnValue).toBeInstanceOf(Object);
      expect(returnValue.status).toBe('deleted');
    });
  });
});