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
            {recipe.ingredient.split("\n").map((item) => (
              <li>{item}</li>
            ))}
            <h3>Instructions</h3>
            <p>
              <ol>
                {recipe.instructions.split("\n").map((step) => (
                  <li>{step}</li>
                ))}
              </ol>
            </p>
          </>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default RecipeItem;
