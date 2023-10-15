import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import { Button, Col, Form, ListGroup, Row } from "react-bootstrap";
import { useState } from "react";
import ViewToggle from "./ViewToggle";
import RecipeItem from "./RecipeItem";

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
    <Navbar variant="dark" bg="dark" expand="lg" className="headernav">
      <Navbar.Brand href="#home">Meals & Recipes</Navbar.Brand>
      {/* <ViewToggle toggleText="Change layout" /> */}
      <Form onSubmit={handleSearch}>
        <Form inline>
          <Row>
            <Col xs="auto">
              <Form.Control
                type="search"
                value={searchValue}
                onChange={(e) => updateSearchValue(e.target.value)}
                placeholder="Search recipe..."
                className="mr-sm-2"
                onSubmit={handleSearch}
              />
            </Col>
            <Col>
              <Button onClick={handleSearch}>Search</Button>
            </Col>
          </Row>
          <Row>
            <Container>
              <ListGroup>
                {recipes.length > 0 && searchValue && 
                  recipes.map((value, i) => (
                    <RecipeItem key={i} recipe={value} />
                    // <ListGroup.Item key={i}>{value.mealName}</ListGroup.Item>
                  ))}
              </ListGroup>
            </Container>
          </Row>
        </Form>
      </Form>
      {/* </Container> */}
    </Navbar>
  );
}

export default Header;
