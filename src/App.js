import "bootstrap/dist/css/bootstrap.min.css";
import "./css/App.css";
import Header from "./components/Header";
import { useState } from "react";
import { Container, Row, ListGroup, Button } from "react-bootstrap";
import MealTabs from "./components/MealTabs";
import { useEffect } from "react";
import RecipeItem from "./components/RecipeItem";
import Spinner from "react-bootstrap/Spinner";
import "./htapi";
import MealsAccordian from "./components/MealsAccordian";
import Search from "./components/Search";

const App = () => {
  const [meals, setMeals] = useState([]);
  const [allMeals, setAllMeals] = useState([]);
  const [viewAccordianState, setAccordianViewState] = useState(true);
  const [randomRecipe, setRandomRecipe] = useState({});

  /**
   * Fetches the data from the json file and stores it as allMeals
   * @param {Event} e
   */
  const getRecipeData = (e) => {
    fetch("data.json")
      .then((response) => response.json())
      .then((data) => {
        // return data
        setAllMeals(data);
        setMeals(data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  /**
   * Filters meals and sets the value of meals
   * @param { string } mealTime
   */
  const updateMeals = (mealTime) => {
    if (mealTime === "All") {
      getRecipeData();
      setMeals(allMeals);
    } else {
      const updatedMeals = allMeals.filter(
        (recipe) => recipe.meal === mealTime
      );
      setMeals(updatedMeals);
    }
  };

  const getRandomRecipe = () => {
    const listLength = meals.length;
    const randomNumber = Math.floor(Math.random() * listLength);
    setRandomRecipe(meals[randomNumber]);
    // setMeals(meals[randomNumber]) //  this is breaking things
  };

  const toggleView = () => {
    setAccordianViewState(!viewAccordianState);
  };

  useEffect(() => {
    getRecipeData();
  }, []);

  return (
    <div className="App">
      <Header title="Meals & Recipes" data={allMeals} />

      <Container className="pt-2 pb-3 recipe-container">
        <Button
          style={{ marginBottom: "20px" }}
          variant="secondary"
          onClick={toggleView}
        >
          Change view type
        </Button>
        <Search data={allMeals} />
        <p className="tutorial">Tap on a row below to view the recipe.</p>
        <>
          {/* <button onClick={getRandomRecipe}>Random Recipe</button> */}
          {/* {randomRecipe && <RecipeItem recipe={randomRecipe} />} */}
        </>
        {viewAccordianState && <MealsAccordian mealsArray={meals} />}
        {!viewAccordianState && (
          <>
            <MealTabs handleTabChange={updateMeals} />
            <Row>
              <ListGroup as="ul">
                {meals.length > 0 &&
                  meals.map((recipe, i) => (
                    <RecipeItem recipe={recipe} key={i} />
                  ))}
              </ListGroup>
            </Row>
          </>
        )}
      </Container>
      {meals.length === 0 && (
        <div>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
      <footer>Made with love and hunger</footer>
    </div>
  );
};

export default App;
