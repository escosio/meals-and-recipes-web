import { useState } from "react";
import { Button } from "react-bootstrap";
import RecipeItem from "../components/RecipeItem";

export function RandomRecipe({ mealData }) {
  const [randomRecipe, setRandomRecipe] = useState(null);

  const getRandomRecipe = () => {
    const listLength = mealData.length;
    const randomNumber = Math.floor(Math.random() * listLength);
    setRandomRecipe(mealData[randomNumber]);
  };
  return (
    <div className="random-recipe">
      <Button onClick={getRandomRecipe} variant="primary" className="mb-3">
        Random Recipe
      </Button>
      <div className="random-recipe-result">
        {randomRecipe && <RecipeItem recipe={randomRecipe} />}
      </div>
    </div>
  );
}
