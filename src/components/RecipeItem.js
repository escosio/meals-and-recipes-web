import { useState } from "react";
import { ListGroupItem } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";

/**
 * ListGroupItem that represents a recipe, and if clicked on will display a fullscreen modal with recipe details.
 *
 * Accepts recipe object as parameter to fill out modal information
 * @param {recipe} param0
 * @returns
 */
function RecipeItem({ recipe }) {
  const [fullscreen, setFullscreen] = useState(true);
  const [show, setShow] = useState(false);
  const hasInstructions = recipe.instructions.length > 0;

  /**
   * Private function to trigger the modal to show for a RecipeItem
   * @param {*} breakpoint
   */
  function handleShow(breakpoint) {
    setFullscreen(breakpoint);
    setShow(true);
  }

  return (
    <>
      <ListGroupItem className="recipe-item" style={{ display: "inline-grid" }}>
        <div onClick={() => handleShow(true)}>{recipe.mealName}</div>
      </ListGroupItem>
      <Modal show={show} fullscreen={fullscreen} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{recipe.mealName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <>
            <h3>Ingredients</h3>
            {recipe.ingredient.split("\n").map((item, i) => (
              <Ingredient ingredient={item} key={i} />
            ))}
            <h3>Instructions</h3>
            {hasInstructions > 0 ? (
              recipe.instructions.split("\n").map((step, i) => (
                <li style={{ listStyle: "none" }} key={i}>
                  {/* TODO: add state to cross out line */}
                  {/* <input type="checkbox" /> */}
                  {step}
                </li>
              ))
            ) : (
              <p>No instructions available</p>
            )}
          </>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default RecipeItem;

function Ingredient({ ingredient }) {
  const [completed, setCompleted] = useState(false);
  return (
    <li style={{ listStyle: "none" }}>
      <input type="checkbox" onChange={() => setCompleted(!completed)} />
      <label style={{ textDecoration: completed ? "line-through" : "none" }}>
        {ingredient}
      </label>
    </li>
  );
}
