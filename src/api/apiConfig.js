const apiConfig = {
  baseUrl: "https://api.themoviedb.org/3",
  apiKey: "4e66d0b440d233d385b30fec4565d72e",
  originalImage: (imgPath) => `https://image.tmdb.org/t/p/original${imgPath}`,
  w500Image: (imgPath) => `https://image.tmdb.org/t/p/w500${imgPath}`,
};

export default apiConfig;
