import React from "react";

import "./movie-card.scss";

import { Link } from "react-router-dom";

import FavoriteButton from "../favorite-button/FavoriteButton";

import Button from "../button/Button";

import { category } from "../../api/tmdbApi";
import apiConfig from "../../api/apiConfig";
import * as Config from "./../../constants/Config";

const MovieCard = (props) => {
  const item = props.item;

  const link =
    "/" + Config.HOME_PAGE + "/" + category[props.category] + "/" + item.id;

  const poster = item.poster_path || item.backdrop_path;
  const bg = poster ? apiConfig.w500Image(poster) : null;

  return (
    <div>
    <Link to={link}>
      <div className="movie-card" style={{ backgroundImage: bg ? `url(${bg})` : undefined }}>
        <Button>
          <i className="bx bx-play"></i>
        </Button>
      </div>
      <h3>{item.title || item.name}</h3>
    </Link>
    <FavoriteButton category={props.category} item={item} />
    </div>
  );
};

export default MovieCard;
