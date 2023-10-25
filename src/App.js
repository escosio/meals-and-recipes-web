import "bootstrap/dist/css/bootstrap.min.css";
import "./css/App.css";
import Header from "./components/Header";
import MealsAccordian from "./components/MealsAccordian";
import { useState } from "react";
import {
  Container,
  Row,
  ListGroup,
  Stack,
  Button
} from "react-bootstrap";
import MealTabs from "./components/MealTabs";
import { useEffect } from "react";
import RecipeItem from "./components/RecipeItem";
import Spinner from "react-bootstrap/Spinner";

const App = () => {
  const [meals, setMeals] = useState([]);
  const [allMeals, setAllMeals] = useState([]);

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
    return meals[randomNumber];
    // setMeals(meals[randomNumber]) //  this is breaking things
  };

  useEffect(() => {
    getRecipeData();
  }, []);
  /**
   * Meals accordian code:
   * <MealsAccordian mealsArray={meals}/>
   */
  return (
    <div className="App">
      <Header title="Meals & Recipes" data={allMeals} />
      {/* <Stack gap={2} className="home-screen">
        <Button className="recipe-button">Breakfast</Button>
        <Button className="recipe-button">Lunch</Button>
        <Button className="recipe-button">Dinner</Button>
        <Button className="recipe-button">All</Button>
      </Stack> */}

      <Container className="pt-2 pb-3">
        <p className="tutorial">Tap on a row below to view the recipe.</p>
        <MealTabs handleTabChange={updateMeals} />
        <Row>
          <ListGroup as="ul">
            {meals.length > 0 &&
              meals.map((recipe, i) => <RecipeItem recipe={recipe} key={i} />)}
          </ListGroup>
        </Row>
      </Container>
      {/* <MealsAccordian /> */}
      {meals.length === 0 && (
        <div>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
      {/* <footer>Made with love and hunger</footer> */}
    </div>
  );
};

export default App;
