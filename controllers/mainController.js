import Movie from '../models/Movie.js';
let savedMovies, totalMovies, totalTimesWatched, sortCriteria;
let favoriteMovies = []; // Store user's favorite movies


export const showMovies = async (req, res) => {
  await aggregateMoviesData();
  savedMovies = await Movie.find().sort(sortCriteria);
  res.render('index', { savedMovies, totalMovies, totalTimesWatched });
}

export const searchMovies = async (req, res) => {
  const movieTitle = req.body.movieTitle;
  try {
    const response = await fetch(`http://www.omdbapi.com/?t=${movieTitle}&apikey=${process.env.MOVIE_KEY}`);
    const movie = await response.json();
    console.log(movie);
    res.render('results', {movie});
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
};

export const saveMovie = async (req, res) => {
  const { title, poster, director, year, boxOffice } = req.body;

  try {
    // Check if the movie already exists in the database
    let movie = await Movie.findOne({ title: title });

    if (movie) {
      // If movie exists, increment the timesWatched
      movie.timesWatched += 1;
      await movie.save();
    } else {
      // If movie doesn't exist, create a new one
      movie = new Movie({
        title,
        poster,
        director,
        year,
        boxOffice,
        timesWatched: 1
      });
      await movie.save();
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const watchMovie = async (req, res) => {
  const movieId = req.params.id;

  try {
    const movie = await Movie.findById(movieId);
    if (movie) {
      movie.timesWatched += 1;
      await movie.save();
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const deleteMovie = async (req, res) => {
  const movieId = req.params.id;

  try {
    const result = await Movie.findByIdAndDelete(movieId);
    console.log(result);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};

export const sortMovies = async (req, res) => {
  console.log(req.body);
  try {
    const sortBy = req.body.sort;

      switch (sortBy) {
        case 'title':
         sortCriteria = { title: 1 };
          break;
        case 'timesWatched':
          sortCriteria = { timesWatched: 1 };
          break;
        case 'year':
          sortCriteria = { year: 1 };
          break;
        case 'boxOffice':
          sortCriteria = { boxOffice: 1 };
          break;
        default:
          sortCriteria = {}; // Default to unsorted list
      }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};


const aggregateMoviesData = async () => {
  try {
    const result = await Movie.aggregate([
      {
        $group: {
          _id: null, // Grouping without a specific field to aggregate all documents
          totalMovies: { $sum: 1 }, // Counting the total number of movies
          totalTimesWatched: { $sum: "$timesWatched" } // Summing up all timesWatched values
        }
      }
    ]);

    if (result.length > 0) {
      // Extracting the result from the first element of the result array
      totalMovies = result[0].totalMovies;
      totalTimesWatched = result[0].totalTimesWatched;
      console.log(`Total Movies: ${totalMovies}, Total Times Watched: ${totalTimesWatched}`);
    } else {
      console.log("No data found.");
    }
  } catch (error) {
    console.error("Error aggregating movie data:", error);
  }
};


// for movieDetails.ejs page
export const showMovieDetails = async (req, res) => {
  
  const movieId = req.params.id;

  try {
    const movie = await Movie.findOne({ _id: movieId });
    if (movie) {
      //res.json(req.params.id);
      res.render('movieDetails', { movie });
    } else {
      res.status(404).send('Movie not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing request');
  }
};


//for favorite movie section
export const showFavorites = async (req, res) => {
  res.render('favorites', { favoriteMovies });
};

export const favoriteMovie = async (req, res) => {
  const movieId = req.params.id;

  try {
    const movie = await Movie.findById(movieId);
    if (movie) {
      // Check if the movie is already in favorites
      const isAlreadyFavorited = favoriteMovies.some(favMovie => favMovie._id.equals(movie._id));

      if (!isAlreadyFavorited) {
        favoriteMovies.push(movie);

        // Add flash message
        req.flash('success', `${movie.title} was added to favorites`);

        res.redirect('/');
      } else {
        // Add flash message for already favorited movie
        req.flash('error', 'Movie already favorited');
        res.redirect('/');
      }
    } else {
      // Add flash message for not found movie
      req.flash('error', 'Movie not found');
      res.redirect('/');
    }
  } catch (error) {
    console.error(error);
    // Add flash message for error
    req.flash('error', 'Error processing request');
    res.redirect('/');
  }
};