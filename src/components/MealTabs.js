import { ListGroup, Row } from "react-bootstrap";
import Nav from "react-bootstrap/Nav";
import RecipeItem from "./RecipeItem";

function MealTabs({ handleTabChange, meals }) {
  return (
    <>
      <Nav
        className="meal-tabs-container"
        fill
        variant="tabs"
        defaultActiveKey="all"
      >
        <Nav.Item>
          <Nav.Link href="/" eventKey="all">
            All
          </Nav.Link>
        </Nav.Item>
        <Nav.Item onClick={() => handleTabChange("Breakfast")}>
          <Nav.Link eventKey="breakfast">Breakfast</Nav.Link>
        </Nav.Item>
        <Nav.Item onClick={() => handleTabChange("Lunch")}>
          <Nav.Link eventKey="lunch">Lunch</Nav.Link>
        </Nav.Item>
        <Nav.Item onClick={() => handleTabChange("Dinner")}>
          <Nav.Link eventKey="dinner">Dinner</Nav.Link>
        </Nav.Item>
      </Nav>
      <Row>
        <ListGroup as="ul">
          {meals.length > 0 &&
            meals.map((recipe, i) => <RecipeItem recipe={recipe} key={i} />)}
        </ListGroup>
      </Row>
    </>
  );
}

export default MealTabs;
