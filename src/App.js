import 'bootstrap/dist/css/bootstrap.min.css';
import './css/App.css';
import Header from './components/Header';
import MealsAccordian from './components/MealsAccordian';
import { useState } from 'react';
import { Button, Container, Row, ListGroup } from 'react-bootstrap';
import MealTabs from './components/MealTabs';
import { useEffect } from 'react';
import RecipeItem from './components/RecipeItem';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';

const App = () => {
  const [meals, setMeals] = useState([]);
  const [allMeals, setAllMeals] = useState([]);

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

  const updateMeals = (mealTime) => {
    if (mealTime === "All") {
      getRecipeData();
      setMeals(allMeals);
    } else {
      const updatedMeals = allMeals.filter((recipe) => recipe.meal === mealTime);
      setMeals(updatedMeals);
    }
  }

  useEffect(() => {
    getRecipeData();
  }, []);
  /**
   * Meals accordian code:
   * <MealsAccordian mealsArray={meals}/>
   */
  return (
    <div className="App">
      <Header title="Meals & Recipes" />
      <Container className="pt-2 pb-3">
        <MealTabs handleTabChange={updateMeals} />
        <Row>
          <ListGroup as="ul">
            {meals.length > 0 &&
              meals.map((recipe, i) => (
                <RecipeItem recipe={recipe} key={i} />
              ))}
          </ListGroup>
        </Row>
      </Container>
      {meals.length === 0 && (
        <div>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
    </div>
  );
}

export default App;
