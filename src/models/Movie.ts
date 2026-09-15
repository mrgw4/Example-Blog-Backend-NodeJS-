import mongoose, { Schema, Document } from 'mongoose';

export interface IAwards {
  nominations: number;
  text: string;
  wins: number;
}

export interface IImdb {
  id: number;
  rating: number | string;
  votes: number | string;
}

export interface ITomatoes {
  boxOffice?: string;
  consensus?: string;
  critic?: {
    meter: number;
    numReviews: number;
    rating: number;
  };
  dvd?: Date;
  fresh?: number;
  lastUpdated: Date;
  production?: string;
  rotten?: number;
  viewer: {
    meter?: number;
    numReviews: number;
    rating: number;
  };
  website?: string;
}

export interface IMovie extends Document {
  _id: mongoose.Types.ObjectId;
  awards: IAwards;
  imdb: IImdb;
  lastupdated: string;
  num_mflix_comments: number;
  title: string;
  type: string;
  year: number | string;
  cast?: string[];
  countries?: string[];
  directors?: string[];
  fullplot?: string;
  genres?: string[];
  languages?: string[];
  metacritic?: number;
  plot?: string;
  poster?: string;
  rated?: string;
  released?: Date;
  runtime?: number;
  tomatoes?: ITomatoes;
  writers?: string[];
}

const AwardsSchema: Schema = new Schema<IAwards>(
  {
    nominations: {
      type: Number,
      required: [true, 'Please provide the number of nominations'],
    },
    text: {
      type: String,
      required: [true, 'Please provide the awards information'],
    },
    wins: {
      type: Number,
      required: [true, 'Please provide the number of wins'],
    },
  },
  { _id: false }
);

const ImdbSchema: Schema = new Schema<IImdb>(
  {
    id: {
      type: Number,
      required: [true, 'Please provide the IMDb ID'],
    },
    rating: {
      type: Schema.Types.Mixed,
      required: [true, 'Please provide an IMDb rating'],
    },
    votes: {
      type: Schema.Types.Mixed,
      required: [true, 'Please provide the number of IMDb votes'],
    },
  },
  { _id: false }
);

const TomatoesViewerSchema: Schema = new Schema(
  {
    meter: Number,
    numReviews: {
      type: Number,
      required: [true, 'Please provide the number of viewer reviews'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide the viewer rating'],
    },
  },
  { _id: false }
);

const TomatoesCriticSchema: Schema = new Schema(
  {
    meter: {
      type: Number,
      required: [true, 'Please provide the critic meter'],
    },
    numReviews: {
      type: Number,
      required: [true, 'Please provide the number of critic reviews'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide the critic rating'],
    },
  },
  { _id: false }
);

const TomatoesSchema: Schema = new Schema<ITomatoes>(
  {
    boxOffice: String,
    consensus: String,
    critic: TomatoesCriticSchema,
    dvd: Date,
    fresh: Number,
    lastUpdated: {
      type: Date,
      required: [true, 'Please provide the Tomatoes last updated date'],
    },
    production: String,
    rotten: Number,
    viewer: {
      type: TomatoesViewerSchema,
      required: [true, 'Please provide Tomatoes viewer information'],
    },
    website: String,
  },
  { _id: false }
);

const MovieSchema: Schema = new Schema<IMovie>(
  {
    awards: {
      type: AwardsSchema,
      required: [true, 'Please provide awards information'],
    },
    cast: [String],
    countries: [String],
    directors: [String],
    fullplot: String,
    genres: [String],
    imdb: {
      type: ImdbSchema,
      required: [true, 'Please provide IMDb information'],
    },
    languages: [String],
    lastupdated: {
      type: String,
      required: [true, 'Please provide the last updated date'],
    },
    metacritic: Number,
    num_mflix_comments: {
      type: Number,
      required: [true, 'Please provide the number of MFlix comments'],
    },
    plot: String,
    poster: String,
    rated: String,
    released: Date,
    runtime: Number,
    title: {
      type: String,
      required: [true, 'Please provide a title'],
    },
    tomatoes: TomatoesSchema,
    type: {
      type: String,
      required: [true, 'Please provide a type'],
    },
    writers: [String],
    year: {
      type: Schema.Types.Mixed,
      required: [true, 'Please provide a year'],
    },
  },
  {
    timestamps: true,
  }
);

const Movie = mongoose.model<IMovie>('Movie', MovieSchema);

export default Movie;
