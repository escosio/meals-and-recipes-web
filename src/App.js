import 'bootstrap/dist/css/bootstrap.min.css';
import './css/App.css';
import Header from './components/Header';
import MealsAccordian from './components/MealsAccordian';
import { useState } from 'react';
import { Button, Container, Row, ListGroup, ListGroupItem } from 'react-bootstrap';
import MealTabs from './components/MealTabs';
import RecipeModal from './components/RecipeModal';
import { useEffect } from 'react';


const App = () => {
  const [meals, setMeals] = useState([]);
  const [allMeals, setAllMeals] = useState([]);

  const getRecipeData = (e) => {
    // e.preventDefault()
    fetch("data.json")
      .then( (response) => response.json())
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
    // setMeals(meals.filter( (recipe) => recipe.meal === mealTime));
  }

  useEffect(() => {
    getRecipeData();
  }, []);
  /**
   * old image card code
   * {
      meals.length > 0 && meals.map((recipe, i) => ( <Col><RecipeCard className="m4" recipeData={recipe} /></Col> ))
    }
   */
  return (
    <div className="App">
      <Header title="Meals & Recipes" />
      <MealTabs handleTabChange={updateMeals} />
      <Container className="pt-2">
        <Row>
          <ListGroup>
            {meals.length > 0 &&
              meals.map((recipe, i) => (
                <ListGroupItem>{recipe.mealName}</ListGroupItem>
              ))}
          </ListGroup>
        </Row>
      </Container>

      {meals.length === 0 && (
        <div>
          <h1>
            Oh no! We weren't able to fetch data successfully. Click the button
            below to try again
          </h1>
          <Button className="m10" variant="primary" onClick={getRecipeData}>
            Get recipes
          </Button>
        </div>
      )}
    </div>
  );
}

export default App;
