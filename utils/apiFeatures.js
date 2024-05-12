class APIFeatures {
  //remember: constructor is called as soon as you create an object out of this class
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    /* ======= ADVANCED FILTERING ======= */
    //req.query lets it use queries in the url - i.e. ?duration=5 finds all with a duration of 5
    //we're gonna make a copy of req.query and filter out any invalid queries before using it

    //doing this bit with {...} creates a RECONSTRUCTED COPY, that will not be linked to the original at all
    //so you won't get that annoying shit it likes to do where, in this case, editing query would also edit req.query
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    //this should iterate thru excluded fields and delete every matching field from query

    // find creates a query object, that eventually needs to be awaited to become a usable array
    // so we're going to first create a query, then do some modification to it. after we're all done working on it, THEN we await it
    var queryStr = JSON.stringify(queryObj);
    // gotta put $ in front of gte, gt, lte, lt so they become recognizable to mongo
    // also gotta use regular expressions, which we all know are a huge pain in the ass
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // this finds each occurence of the things we gotta replace, then adds the $. probably just copy/pase this exact code when needed

    this.query = this.query.find(JSON.parse(queryStr));
    // now we use a parsed version of that string, and it successfully queries with all the options
    return this;
    //return this returns the ENTIRE OBJECT

    // // here's the most stock-standard simple version of querying:
    // const tours = await Tour.find(req.query);

    // // here's an example of other specific mongoose methods for querying:
    // const query = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');
    // //using .where and .equals in sequence creates the conditions
    // //can also use .lt for less than, .lte for less than or equal, .gt greater than, and some others you can look up if you need em
  }
  sort(toSort) {
    /* ======= SORTING ======= */

    //url queries: sort=X sorts ascending, sort=-X sorts descending
    // secondary sort: sort=X,Y
    if (toSort) {
      this.queryString.sort = toSort;
    }
    if (this.queryString.sort) {
      // this will turn the 'X,Y' into 'X Y', which is what query.sort wants
      const sortBy = this.queryString.sort.split(',').join(' ');
      // .sort another useful method for queries - again, only works before we finalize it with await
      this.query = this.query.sort(sortBy);
      // to have a secondary sort from internal just put two fields in the ()
      // ie: sort('price ratingsAverage') sorts by price, and items with matching prices are sorted by ratingsAverage
    } else {
      //a default sort if the user doesn't specify, makes it so most recent entries come out first
      this.query = this.query.sort('-createdAt');
    }
    //this will be useful for getting shows & matches in the right order to then calculate power
    return this;
  }
  limitFields(fields) {
    /* ======= FIELD LIMITING ======= */
    // URL: fields=x,y,z
    if (fields) {
      this.queryString.fields = fields;
    }

    if (this.queryString.fields) {
      //works a lot like sorting. .select only returns the fields referenced in the string
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // -X here means it returns everything BUT the specified field
      this.query = this.query.select('-__v');
    }
    return this;
  }
  paginate() {
    /* ======= PAGINATION ======= */
    // URL: page=2&limit=10
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
