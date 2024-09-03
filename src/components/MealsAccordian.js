import React from "react";
import Accordion from "react-bootstrap/Accordion";
import AccordionBody from "react-bootstrap/esm/AccordionBody";
import AccordionHeader from "react-bootstrap/esm/AccordionHeader";
import RecipeItem from "./RecipeItem";
import { ListGroup } from "react-bootstrap";

/**
 * Dropdown of Meals that holds recipes for give mean inside of it
 * @param {*} param0
 * @returns
 */

// Should change to accept an array of meals that are filtered on App.js
function MealsAccordian({ mealsArray }) {
  const allMeals = mealsArray;
  const breakfastMeals = mealsArray.filter(
    (recipe) => recipe.meal === "Breakfast"
  );
  const lunchMeals = mealsArray.filter((recipe) => recipe.meal === "Lunch");
  const dinnerMeals = mealsArray.filter((recipe) => recipe.meal === "Dinner");

  return (
    <Accordion className="mt-6" defaultActiveKey="3">
      <Accordion.Item eventKey="0">
        <Accordion.Header>Breakfast</Accordion.Header>
        <Accordion.Body>
          <ListGroup>
            {breakfastMeals.map((recipe, i) => (
              <RecipeItem key={i} recipe={recipe} />
            ))}
          </ListGroup>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>Lunch</Accordion.Header>
        <Accordion.Body>
          <ListGroup>
            {lunchMeals.map((recipe, i) => (
              <RecipeItem key={i} recipe={recipe} />
            ))}
          </ListGroup>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="2">
        <AccordionHeader>Dinner</AccordionHeader>
        <AccordionBody>
          <ListGroup>
            {dinnerMeals.map((recipe, i) => (
              <RecipeItem key={i} recipe={recipe} />
            ))}
          </ListGroup>
        </AccordionBody>
      </Accordion.Item>
      <Accordion.Item>
        <AccordionHeader>All</AccordionHeader>
        <AccordionBody>
          <ListGroup>
            {allMeals.map((recipe, i) => (
              <RecipeItem key={i} recipe={recipe} />
            ))}
          </ListGroup>
        </AccordionBody>
      </Accordion.Item>
    </Accordion>
  );
}

export default MealsAccordian;
