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
      required: [true, 'Awards nominations is required'],
    },
    text: {
      type: String,
      required: [true, 'Awards text is required'],
    },
    wins: {
      type: Number,
      required: [true, 'Awards wins is required'],
    },
  },
  { _id: false }
);

const ImdbSchema: Schema = new Schema<IImdb>(
  {
    id: {
      type: Number,
      required: [true, 'IMDb ID is required'],
    },
    rating: {
      type: Schema.Types.Mixed,
      required: [true, 'IMDb rating is required'],
    },
    votes: {
      type: Schema.Types.Mixed,
      required: [true, 'IMDb votes is required'],
    },
  },
  { _id: false }
);

const TomatoesViewerSchema: Schema = new Schema(
  {
    meter: Number,
    numReviews: {
      type: Number,
      required: [true, 'Tomatoes viewer numReviews is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Tomatoes viewer rating is required'],
    },
  },
  { _id: false }
);

const TomatoesCriticSchema: Schema = new Schema(
  {
    meter: {
      type: Number,
      required: [true, 'Tomatoes critic meter is required'],
    },
    numReviews: {
      type: Number,
      required: [true, 'Tomatoes critic numReviews is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Tomatoes critic rating is required'],
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
      required: [true, 'Tomatoes lastUpdated is required'],
    },
    production: String,
    rotten: Number,
    viewer: {
      type: TomatoesViewerSchema,
      required: [true, 'Tomatoes viewer is required'],
    },
    website: String,
  },
  { _id: false }
);

const MovieSchema: Schema = new Schema<IMovie>(
  {
    awards: {
      type: AwardsSchema,
      required: [true, 'Awards is required'],
    },
    cast: [String],
    countries: [String],
    directors: [String],
    fullplot: String,
    genres: [String],
    imdb: {
      type: ImdbSchema,
      required: [true, 'IMDb is required'],
    },
    languages: [String],
    lastupdated: {
      type: String,
      required: [true, 'Last updated is required'],
    },
    metacritic: Number,
    num_mflix_comments: {
      type: Number,
      required: [true, 'Number of MFlix comments is required'],
    },
    plot: String,
    poster: String,
    rated: String,
    released: Date,
    runtime: Number,
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    tomatoes: TomatoesSchema,
    type: {
      type: String,
      required: [true, 'Type is required'],
    },
    writers: [String],
    year: {
      type: Schema.Types.Mixed,
      required: [true, 'Year is required'],
    },
  },
  {
    timestamps: true,
  }
);

const Movie = mongoose.model<IMovie>('Movie', MovieSchema);

export default Movie;
