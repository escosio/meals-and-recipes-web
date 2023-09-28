import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import AccordionBody from 'react-bootstrap/esm/AccordionBody';
import AccordionHeader from 'react-bootstrap/esm/AccordionHeader';
import RecipeCard from './RecipeCard';

/**
 * Dropdown of Meals that holds recipes for give mean inside of it
 * @param {*} param0 
 * @returns 
 */

// Should change to accept an array of meals that are filtered on App.js
function MealsAccordian({ mealsArray }) {
  const breakfastMeals = mealsArray.filter((recipe) => recipe.meal === "Breakfast");
  const lunchMeals = mealsArray.filter((recipe) => recipe.meal === "Lunch");
  const dinnerMeals = mealsArray.filter((recipe) => recipe.meal === "Dinner");
  // console.log(breakfastMeals)

  return (
    <Accordion className='mt-6'>
      <Accordion.Item eventKey="0">
        <Accordion.Header>Breakfast</Accordion.Header>
        <Accordion.Body>
          Breakfast is served
          { breakfastMeals.map((recipe, i) => (
            <RecipeCard key={i} recipeData={recipe} />
          ))}
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>Lunch</Accordion.Header>
        <Accordion.Body>
          { lunchMeals.map((recipe, i) => (
            <RecipeCard key={i} recipeData={recipe} />
          ))}
          <RecipeCard />
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey='2'>
        <AccordionHeader>Dinner</AccordionHeader>
        <AccordionBody>
            <RecipeCard key={1}></RecipeCard>
        </AccordionBody>
      </Accordion.Item>
    </Accordion>
  );
}

export default MealsAccordian;