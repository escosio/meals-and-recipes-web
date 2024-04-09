import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import { Button, Form, ListGroup, Nav, Stack } from "react-bootstrap";
import { useState } from "react";
import RecipeItem from "./RecipeItem";
import "../css/App.css";

/**
 * Header component for application, has brand text and search bar. The function accepts a object parameter for recipe object data to use against search
 * @returns
 */
function Header({ data, searchAction }) {
  const [searchValue, updateSearchValue] = useState("");
  const [recipes, updateRecipes] = useState({});
  const recipeData = data;

  const handleSearch = (e) => {
    if (searchValue) {
      e.preventDefault();
      const filteredResults = recipeData.filter((recipe) =>
        recipe.mealName.toLowerCase().includes(searchValue.toLowerCase())
      );
      updateRecipes(filteredResults);
    }
  };

  return (
    <Navbar variant="dark" bg="dark" expand="xs" className="headernav">
      <Navbar.Brand md={10} href="#home">Meals & Recipes <i class="fa-solid fa-utensils"></i></Navbar.Brand>
      <Nav.Item>
        <Form onSubmit={handleSearch}>
          <Stack direction="horizontal" gap={1}>
            <Form.Control
              type="search"
              value={searchValue}
              onChange={(e) => updateSearchValue(e.target.value)}
              placeholder="Search recipe..."
              className="mr-sm-2"
            />
            <Button onClick={handleSearch}>Search</Button>
          </Stack>
          <Container>
            <ListGroup>
              {recipes.length > 0 &&
                searchValue &&
                recipes.map((value, i) => (
                  <RecipeItem key={i} recipe={value} />
                ))}
            </ListGroup>
          </Container>
        </Form>
      </Nav.Item>
    </Navbar>
  );
}

export default Header;
