import React, { useState } from "react";
import { Button, Form, ListGroup, Stack, Container } from "react-bootstrap";
import RecipeItem from "./RecipeItem";

export default function Search({ data }) {
  const [searchValue, updateSearchValue] = useState("");
  const [recipes, updateRecipes] = useState({});

  const handleSearch = (e) => {
    if (searchValue) {
      e.preventDefault();
      const filteredResults = data.filter((recipe) =>
        recipe.mealName.toLowerCase().includes(searchValue.toLowerCase())
      );
      updateRecipes(filteredResults);
    }
  };

  return (
    <div>
      <Form onSubmit={handleSearch} onChange={handleSearch}>
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
              recipes.map((value, i) => <RecipeItem key={i} recipe={value} />)}
          </ListGroup>
        </Container>
      </Form>
    </div>
  );
}
