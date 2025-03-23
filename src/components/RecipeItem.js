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
            <div style={{ marginBottom: "10px" }}>
              <h3>Ingredients</h3>
              {recipe.ingredient.split("\n").map((item, i) => (
                <Ingredient ingredient={item} key={i} />
              ))}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <h3>Instructions</h3>
              <ol>
                {hasInstructions ? (
                  recipe.instructions
                    .split("\n")
                    .map((step, i) => <li key={i}>{step}</li>)
                ) : (
                  <p>No instructions available</p>
                )}
              </ol>
            </div>
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
    <li
      style={{
        listStyle: "none",
        display: "flex",
        border: "1px solid #ddd",
        borderRadius: "4px",
        padding: "5px",
        marginBottom: "5px",
        backgroundColor: completed ? "#f0f0f0" : "transparent",
      }}
      onClick={() => setCompleted((c) => !c)}
    >
      <input
        type="checkbox"
        checked={completed}
        onChange={() => {
          setCompleted((c) => !c);
        }}
      />
      <label
        style={{
          textDecoration: completed ? "line-through" : "none",
          marginLeft: "5px",
        }}
      >
        {ingredient}
      </label>
    </li>
  );
}
